#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
ctid= template= storage=local-lvm bridge=vmbr0 port=8080 dry=false
usage(){ echo 'Run on Proxmox: bash scripts/install-lxc.sh --id 120 --template local:vztmpl/debian-13-standard_VERSION_amd64.tar.zst [--storage local-lvm] [--bridge vmbr0] [--port 8080] [--dry-run]'; }
while [ "$#" -gt 0 ]; do
 case "$1" in
  --id|--template|--storage|--bridge|--port) [ "$#" -ge 2 ] || { usage; exit 1; }; key=${1#--}; [ "$key" != id ] || key=ctid; printf -v "$key" '%s' "$2"; shift 2 ;;
  --dry-run) dry=true; shift ;;
  --help) usage; exit 0 ;;
  *) usage; exit 1 ;;
 esac
done
if [ "$dry" = false ]; then
 [ "$(id -u)" -eq 0 ] || { echo 'Run as root on the Proxmox host' >&2; exit 1; }
 command -v pct >/dev/null || { echo 'pct not found; this script needs Proxmox VE' >&2; exit 1; }
 if [ -z "$ctid" ]; then suggested=$(pvesh get /cluster/nextid); read -r -p "New container ID [$suggested]: " ctid; ctid=${ctid:-$suggested}; fi
 if [ -z "$template" ]; then pveam list local; read -r -p 'Downloaded Debian/Ubuntu template volume ID: ' template; fi
fi
[[ "$ctid" =~ ^[1-9][0-9]{2,8}$ ]] || { echo 'Provide a numeric container ID of at least 100' >&2; exit 1; }
[[ "$port" =~ ^[0-9]{1,5}$ ]] && [ "$port" -ge 1 ] && [ "$port" -le 65535 ] || { echo 'Invalid TCP port' >&2; exit 1; }
[[ "$storage" =~ ^[a-zA-Z0-9_-]+$ && "$bridge" =~ ^[a-zA-Z0-9_.-]+$ ]] || { echo 'Invalid storage or bridge' >&2; exit 1; }
[[ "$template" =~ ^[a-zA-Z0-9_-]+:vztmpl/[a-zA-Z0-9._-]+\.(tar\.zst|tar\.gz|tar\.xz)$ ]] || { echo 'Invalid template volume ID' >&2; exit 1; }
echo "Plan: new unprivileged LXC $ctid, template $template, storage $storage, bridge $bridge, DHCP, port $port."
if [ "$dry" = true ]; then exit 0; fi
[ ! -e "/etc/pve/lxc/$ctid.conf" ] || { echo 'Container ID already exists; no changes made' >&2; exit 1; }
ip link show "$bridge" >/dev/null || { echo 'Selected bridge does not exist' >&2; exit 1; }
[ -d "/sys/class/net/$bridge/bridge" ] || { echo 'Selected interface is not a bridge' >&2; exit 1; }
pvesm path "$template" >/dev/null
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
# Copy only app source, never credentials, photos, archives or local Git history.
tar --exclude=.git --exclude=node_modules --exclude=data --exclude=.env --exclude=artifacts --exclude='*.zip' -C "$root" -czf "$work/homeboard.tar.gz" .
pct create "$ctid" "$template" --hostname homeboard-dashboard --unprivileged 1 --cores 1 --memory 768 --swap 256 --rootfs "$storage:6" --onboot 1 --net0 "name=eth0,bridge=$bridge,ip=dhcp,ip6=auto,firewall=1"
# Protect the new container while allowing dashboard traffic from private LANs.
# Existing host network and firewall files are left in place.
[ ! -e "/etc/pve/firewall/$ctid.fw" ] || { echo 'Firewall file already exists; inspect it before continuing' >&2; exit 1; }
cat > "/etc/pve/firewall/$ctid.fw" <<RULES
[OPTIONS]
enable: 1
dhcp: 1
policy_in: DROP
policy_out: ACCEPT

[RULES]
IN ACCEPT -source 10.0.0.0/8 -p tcp -dport $port
IN ACCEPT -source 172.16.0.0/12 -p tcp -dport $port
IN ACCEPT -source 192.168.0.0/16 -p tcp -dport $port
RULES
pct start "$ctid"
pct exec "$ctid" -- bash -c 'apt-get update && apt-get install -y ca-certificates curl xz-utils'
pct exec "$ctid" -- mkdir -p /opt/homeboard
pct push "$ctid" "$work/homeboard.tar.gz" /tmp/homeboard.tar.gz
pct exec "$ctid" -- bash -c 'tar -xzf /tmp/homeboard.tar.gz -C /opt/homeboard && rm /tmp/homeboard.tar.gz && bash /opt/homeboard/scripts/install-node.sh'
pct exec "$ctid" -- node /opt/homeboard/scripts/setup.mjs local --service --port "$port"
echo "Container $ctid installed. Logs: pct exec $ctid -- journalctl -u homeboard-dashboard"
echo 'Reserve its DHCP address on your router so tablets keep the same URL.'
