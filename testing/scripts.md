```sh
docker run --cap-add=NET_ADMIN -it --rm ubuntu_nft
nft --json list ruleset
```

```sh
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

ip --json route show table all
ip --json rule
ip -6 --json rule
```
