#!/usr/bin/env bash
# Standalone entrypoint: download and run on a Proxmox host, without a checkout.
set -Eeuo pipefail
trap 'status=$?; echo "HomeBoard installation stopped at line $LINENO (exit $status). See the error above." >&2; exit "$status"' ERR
fail() { echo "HomeBoard: $*" >&2; exit 1; }
dry=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry=true ;;
    --help) echo 'Usage: bash bootstrap-proxmox.sh [--dry-run]'; exit 0 ;;
    *) fail "Unknown option: $arg" ;;
  esac
done
[ "$(id -u)" -eq 0 ] && command -v pct >/dev/null || fail 'Run as root on the Proxmox host.'
[ "$(uname -m)" = x86_64 ] || fail 'This installer currently requires an x86_64 Proxmox host.'
for command in pvesm pveam pvesh ip; do
  command -v "$command" >/dev/null || fail "Required Proxmox command missing: $command"
done

# pvesm reports capacity in KiB. Select active pools with space for the 6 GiB guest.
storage=$(pvesm status --content rootdir | awk '$3=="active" && $6>=6291456 && $6>max {max=$6; name=$1} END {print name}')
templates=$(pvesm status --content vztmpl | awk '$3=="active" && $6>=1048576 && $6>max {max=$6; name=$1} END {print name}')
[ -n "$storage" ] && [ -n "$templates" ] || fail 'No active storage with enough space for the guest and template.'
bridges=$(ip -o link show type bridge | awk '{name=$2; sub(/:$/, "", name); sub(/@.*/, "", name); print name}')
route_bridge=$(ip -4 route show default | awk '{for(i=1;i<=NF;i++) if($i=="dev") {print $(i+1); exit}}')
bridge=$(printf '%s\n' "$bridges" | awk -v route="$route_bridge" 'NF {if(!first) first=$1; if($1=="vmbr0") standard=$1; if($1==route) preferred=$1} END {if(preferred) print preferred; else if(standard) print standard; else print first}')
[ -n "$bridge" ] || fail 'No network bridge found.'

if [ "$dry" = false ]; then
  export DEBIAN_FRONTEND=noninteractive
  # Use only signed Debian sources for these tools. Host enterprise and third-party
  # repositories and cached indexes must not participate in this installation.
  codename=$(sh -c '. /etc/os-release; printf "%s" "${VERSION_CODENAME:-}"')
  case "$codename" in
    bookworm|trixie) ;;
    *) fail "Unsupported Debian release: $codename (expected bookworm or trixie)." ;;
  esac
  work=$(mktemp -d /tmp/homeboard-install.XXXXXX)
  trap 'rm -rf "$work"' EXIT
  chmod 755 "$work"
  mkdir -p "$work/sources.list.d" "$work/lists/partial"
  cat > "$work/debian.list" <<SOURCES
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://deb.debian.org/debian $codename main
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://deb.debian.org/debian $codename-updates main
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://security.debian.org/debian-security $codename-security main
SOURCES
  apt_options=(
    -o "Dir::Etc::sourcelist=$work/debian.list"
    -o "Dir::Etc::sourceparts=$work/sources.list.d"
    -o "Dir::State::lists=$work/lists"
    -o 'Dir::Cache::pkgcache='
    -o 'Dir::Cache::srcpkgcache='
    -o 'APT::Update::Error-Mode=any'
  )
  echo 'Installing download tools from signed Debian repositories and refreshing the template catalogue...'
  apt-get "${apt_options[@]}" update
  apt-get "${apt_options[@]}" install -y git ca-certificates
  pveam update
fi
# Debian 12 works with both Proxmox VE 8 and 9.
template=$(pveam available --section system | awk '$2 ~ /^debian-12-standard_.*_amd64\.tar\.(zst|gz|xz)$/ {print $2; exit}')
[ -n "$template" ] || fail 'No Debian 12 template available in the Proxmox catalogue.'
ctid=$(pvesh get /cluster/nextid)
[[ "$ctid" =~ ^[1-9][0-9]{2,8}$ ]] || fail 'Proxmox did not return a valid unused container ID.'
echo "Plan: HomeBoard LXC $ctid, template $templates:vztmpl/$template, storage $storage, bridge $bridge, DHCP, port 8080."
if [ "$dry" = true ]; then exit 0; fi

pveam download "$templates" "$template"
git clone --depth 1 --branch main https://github.com/MooreSi/HomeBoard.git "$work/HomeBoard"
bash "$work/HomeBoard/scripts/install-lxc.sh" \
  --id "$ctid" --template "$templates:vztmpl/$template" \
  --storage "$storage" --bridge "$bridge" --port 8080
