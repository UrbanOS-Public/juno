How to add to what datasets Andi creates by default in the Juno environment.

You can modify an existing example. But schema might be hard to get right.

Alternatively

1. Create your dataset / ingestion in Andi UI
2. Shell into the andi pod in k8s
3. `bin/andi remote_console`
4. `dataset = Andi.InputSchemas.Datasets.get("{your dataset id}")

- id can be seen in the route of the browser
- Alternatively `.Ingestions.get`

5. `Andi.InputSchemas.InputConverter.andi_dataset_to_smrt_dataset(dataset)`

- Alternatively `andi_ingestion_to_smrt_ingestion`

6. Use that as a reference to create a new .json file in the `initialize_andi_req_data` folder
7. Add a reference to that new request body file, in a curl request in `initialize_andi.sh`
