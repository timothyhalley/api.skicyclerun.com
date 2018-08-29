aws apigateway test-invoke-method \
 --rest-api-id vjr4hex4te \
 --resource-id vmyl7krd33 \
 --http-method GET \
 --path-with-query-string '/500x500/BlueMarble.jpg'

# aws lambda invoke \
# --invocation-type RequestResponse \
# --region us-west-2 \
# --function-name image-resize \
# --payload file://./event.json \
# ./results.txt

# echo results:
# echo
# cat ./results.txt
echo
echo finished
echo
