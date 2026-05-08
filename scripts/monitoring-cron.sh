#!/bin/bash
# FahadCloud Monitoring Cron - Records metrics every 5 minutes
curl -s -X POST http://localhost:3000/api/agent/monitor/collect   -H "Authorization: Bearer $(grep JWT_SECRET /home/fahad/fahadcloud/.env | cut -d= -f2)"   > /dev/null 2>&1
