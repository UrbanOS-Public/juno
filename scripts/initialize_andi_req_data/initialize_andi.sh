# exit when any command fails
set -e

# for 10 minutes, try to make an organization
echo "Creating org_one as a health check..."
n=0
until [ "$n" -ge 60 ]
do
  res_code=$(curl -s -o response.txt -w "%{http_code}" -d "@scripts/initialize_andi_req_data/create_org_one.json" -H "Content-Type: application/json" -X POST https://andi.demo-urbanos.com/api/v1/organization)
  if [ $res_code == "201" ]; then
    echo "✅ - Andi is healthy, org_one created."
    break
  else
    echo "Andi in bad health ($res_code), waiting 10 seconds $n/60"
    n=$((n+1)) 
    sleep 10
  fi
done

if [$res_code != "201"]; then
  echo "❌ - After 10 minutes, andi was never healhty"
  echo "last response ($res_code)"
  cat response.txt
  exit 1
fi

# echo "todo: create other resource"
# confirm_success
# echo "todo: create other resource"
# confirm_success

confirm_success() {
  if [ $res_code != "200" ]; then
      echo "Unable to create resource. Response - $res_code"
      cat response.txt
      echo "❌ - Exiting before creating more andi entities"
      exit 1
  else
      echo "✅ - Create success!"
  fi
}
