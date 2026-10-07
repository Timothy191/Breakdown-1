# LAN deployment

1. Install Docker Engine and Compose on the designated LAN host.
2. Clone this repository to the host.
3. Copy .env.example to .env and set production credentials.
4. Run docker compose up -d --build.
5. Open the host LAN address on TCP 3000 from approved client networks.
6. Keep PostgreSQL unpublished; only the web service port is exposed.
7. Add the host firewall rule permitting TCP 3000 only from the approved LAN subnet.
8. Test from a second LAN workstation and confirm the health endpoint.

The application is not intended to be exposed directly to the public Internet.