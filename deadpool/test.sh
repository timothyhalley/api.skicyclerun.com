#!/bin/bash
#

echo -e 'must match URL from claudia UPDATE:\n'

#curl https://yqplyxnwnh.execute-api.us-west-2.amazonaws.com/latest/verifyPath/andreaMe/20170810115331_EB.jpg

curl https://yqplyxnwnh.execute-api.us-west-2.amazonaws.com/latest/getImage/tahoe2010/111111.jpg

echo -e '\nFINISH'
# --policies policies/*.json
# {
#   "Action": [
#     "dynamodb:DeleteItem",
#     "dynamodb:GetItem",
#     "dynamodb:PutItem",
#     "dynamodb:Scan"
#   ],
#   "Effect": "Allow",
#   "Resource": "*"
# },
