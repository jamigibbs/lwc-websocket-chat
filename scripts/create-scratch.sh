#!/bin/bash
#https://stackoverflow.com/questions/8903239/how-to-calculate-time-elapsed-in-bash-script

function waitfor() {
    echo "waiting for $1 seconds"
    sleep $1
}

echo -n 'Enter org alias > '
read orgAlias
START=$(date +%s)

echo "=== creating scratch org $orgAlias"
sfdx force:org:create -s -a ${orgAlias} -f config/project-scratch-def.json
if [ $? -ne 0 ]; then { echo "Command had error... exiting." ; exit 1; } fi
END=$(date +%s)
echo $((END-START)) | awk '{printf "%02d:%02d\n",int($1/60), int($1%60)}'
waitfor 10

echo "=== pushing project to $orgAlias org `date`"
sfdx force:source:push -u ${orgAlias}
if [ $? -ne 0 ]; then { echo "Command had error... exiting." ; exit 1; } fi
END=$(date +%s)
echo $((END-START)) | awk '{printf "%02d:%02d\n",int($1/60), int($1%60)}'

echo "=== data setup"
echo "*** base data import"
sfdx force:data:tree:import -u ${orgAlias} -p data/org-data-plan.json
if [ $? -ne 0 ]; then { echo "Command had error... exiting." ; exit 1; } fi

echo "*** creating chat user"
sfdx force:user:create -u ${orgAlias} --setalias chat-user

END=$(date +%s)
echo $((END-START)) | awk '{printf "%02d:%02d\n",int($1/60), int($1%60)}'

echo "=== opening scratch org"
sfdx force:org:open -u ${orgAlias}
END=$(date +%s)

echo "=== total script time"
echo $((END-START)) | awk '{printf "%02d:%02d\n",int($1/60), int($1%60)}'