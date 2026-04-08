#!/bin/bash
set -e

# Apply IP routing rules
echo "100 ipv4_demo" >> /etc/iproute2/rt_tables
echo "200 ipv6_demo" >> /etc/iproute2/rt_tables
ip route add 172.17.0.0/16 dev eth0 table ipv4_demo
ip route add default via 172.17.0.1 dev eth0 table ipv4_demo
ip rule add from 172.17.0.2/32 table ipv4_demo
ip rule add to 1.1.1.1/32 table ipv4_demo
ip -6 addr add 2001:db8::1/128 dev lo
ip -6 route add local 2001:db8::1/128 dev lo table ipv6_demo
ip -6 route add default dev lo table ipv6_demo
ip -6 rule add from 2001:db8::1/128 table ipv6_demo
ip -6 rule add to 2001:4860:4860::8888/128 table ipv6_demo

# Apply nftables rules
nft add table arp arp_example
nft add chain arp arp_example main_chain
nft add chain arp arp_example check_chain
nft add rule arp arp_example main_chain jump check_chain
nft add rule arp arp_example check_chain arp operation request accept
nft add rule arp arp_example check_chain arp operation reply drop

# Execute the main application
exec "$@"
