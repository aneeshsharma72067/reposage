docker build -t nonchalant1024/traceon-worker:v1 -f workers/analyzer/Dockerfile .
az containerapp update --name traceon-worker --resource-group traceon-rg --min-replicas 1 --max-replicas 2
az containerapp show --name traceon-worker --resource-group traceon-rg --query "properties.template.scale"
