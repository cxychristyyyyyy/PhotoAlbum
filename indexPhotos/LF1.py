import json
import boto3
import requests
from datetime import date, datetime


ES_ENDPOINT = 'https://search-photos-mpatg4ejrpb2log4ifkxzkfaxi.us-east-1.es.amazonaws.com'


#helper function for getting url
def get_url(index, type):
    url = ES_ENDPOINT + '/' + index + '/' + type
    return url

#get lables from uploaded photos
def get_labels(bucket, key):
    client = boto3.client('rekognition')
    response = client.detect_labels(
        Image={
            'S3Object': {
                'Bucket': bucket,
                'Name': key
            }
        },
        MaxLabels = 100
    )

    labels = []
    for label in response['Labels']:
        labels.append(label['Name'].lower())

    print("result", labels)
    return labels


def lambda_handler(event, context):
    print("event", event)

    #for record in event['Records']:
    #bucket = record['s3']['bucket']['name']
    #photo_name = event['Records']['s3']['object']['key']
    bucket = event['Records'][0]['s3']['bucket']['name']
    photo_name = event['Records'][0]['s3']['object']['key']
    print(bucket)
    print(photo_name)

    #get custom lable using head_object() method
    s3 = boto3.client('s3')
    try:
        response = s3.head_object(
            Bucket=bucket,
            Key=photo_name
        )
        print("response", response['Metadata'])
        customlabel = response['Metadata']['customlabels']

    except:
        customlabel = []
        print("No custom label")

    labels = get_labels(bucket, photo_name)
    if len(customlabel) != 0 :
        custom_label = customlabel.split(",")

        for cl in custom_label:
            labels.append(cl)

    created_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(created_timestamp)

    #json object stored in es
    object = {
        'objectKey': photo_name,
        'bucket': bucket,
        'createdTimestamp': created_timestamp,
        'labels': labels
    }
    JSON_object = json.dumps(object)
    print(JSON_object)

    headers = {"Content-Type": "application/json"}
    url = get_url('photos', 'Photo')

    auth = ('Master', 'CloudComputing1!')

    req = requests.post(url, data = JSON_object, headers = headers, auth = auth)
    print("response from es: ", req)

    return {
        'statusCode': 200,
        'headers': {
            "Access-Control-Allow-Origin": "*",
            'Content-Type': 'application/json'
        },
        'body': json.dumps("Successfully indexed the image!")
    }