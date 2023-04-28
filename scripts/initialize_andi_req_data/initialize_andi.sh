confirm_success() {
  if [ $res_code != "201" ]; then
      cat response.txt
      echo "\n❌ Unable to create resource. Response - $res_code"
      exit 10
  else
      echo "✅ - Create success!"
  fi
}

if [[ $* != *--skip-health-check* ]]; then
  # for 10 minutes, try to make an organization
  echo "Creating org_one as a health check..."
  n=0
  until [ "$n" -ge 60 ]
  do
    res_code=$(curl -k -s -o response.txt -w "%{http_code}" -d "@scripts/initialize_andi_req_data/create_org_one.json" -H "Content-Type: application/json" -X POST https://andi.demo-urbanos.com/api/v1/organization)
    if [ $res_code == "201" ]; then
      echo "✅ - Andi is healthy, org_one created."
      echo "Waiting for an extra minute to ensure kafka connections across cluster"
      sleep 20
      echo "40 seconds remaining"
      sleep 20
      echo "20 seconds remaining"
      sleep 20
      break
    else
      echo "Andi in bad health ($res_code), waiting 10 seconds $n/60"
      n=$((n+1)) 
      sleep 10
    fi
  done

  if [ $res_code != "201" ]; then
    echo "❌ - After 10 minutes, andi was never healhty"
    echo "last response ($res_code)"
    cat response.txt
    exit 11
  fi
fi

echo "Creating traffic center organization"
res_code=$(curl -k -s -o response.txt -w "%{http_code}" -d "@scripts/initialize_andi_req_data/create_org_two.json" -H "Content-Type: application/json" -X POST https://andi.demo-urbanos.com/api/v1/organization)
confirm_success
sleep 5

echo "Creating crash dataset"
res_code=$(curl -k -s -o response.txt -w "%{http_code}" -d "@scripts/initialize_andi_req_data/create_crash_dataset.json" -H "Content-Type: application/json" -X PUT https://andi.demo-urbanos.com/api/v1/dataset)
confirm_success
sleep 5

echo "Drafting crash ingestion"
res_code=$(curl -k -s -o response.txt -w "%{http_code}" -d "@scripts/initialize_andi_req_data/create_crash_ingestion.json" -H "Content-Type: application/json" -X PUT https://andi.demo-urbanos.com/api/v1/ingestion)
confirm_success
sleep 5

echo "Publishing drafted crash ingestion"
res_code=$(curl -k -s -o response.txt -w "%{http_code}" -X POST "https://andi.demo-urbanos.com/api/v1/ingestion/publish?id=a9ab987d-fcce-4ee7-94b4-9b87588a1c68")
confirm_success