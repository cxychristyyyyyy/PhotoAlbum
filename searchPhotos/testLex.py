import json
import boto3
import requests
import inflect


def photoDetails(photo):
    print("6", photo)
    bucket = photo["_source"]["bucket"]
    name = photo["_source"]["objectKey"]
    labels = photo["_source"]["labels"]
    print("10", labels)
    url = "https://{}.s3.amazonaws.com/{}".format(bucket, name)
    print("11", url)
    res = {"url": url, "labels": labels}
    print("16", res)
    #print("testtesttest)
    return res


def searchPhotos(keyWords):
    region = "us-east-1"
    service = "es"
    auth = ("Master", "CloudComputing1!")
    host = "https://search-photos-mpatg4ejrpb2log4ifkxzkfaxi.us-east-1.es.amazonaws.com"
    index = "photos"
    q = ""
    for i in keyWords:
        q += str(i + " ")
        print("26", q)
    url = host + "/" + index + "/_search?q=" + q

    print("36")

    r = requests.get(url, auth=auth)

    photos = json.loads(r.text)

    if "hits" not in photos and "hits" not in photos["hits"]:
        print("here 34")
        return {
            "statusCode": 400,
            "body": "Bad Request"
        }

    # get the photo response from the photos dictionary
    print("41", photos["hits"]["hits"])
    res = list(map(photoDetails, photos["hits"]["hits"]))
    print("45", res)
    return {
        "statusCode": 200,
        "body": json.dumps({"results": res})
    }


def lambda_handler(event, context):
    # initialize the response
    response = dict()

    # initialize the response header
    response["headers"] = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT",
        "Access-Control-Allow-Headers": "Access-Control-Allow-Origin,Access-Control-Allow-Methods,Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With,x-api-key"
    }
    print(event)
    try:

        # get the query from the user:
        if event["httpMethod"].upper() == "OPTIONS":
            response["statusCode"] = 200
            return response

        query = event["queryStringParameters"]["q"]

        # Disambiguate the query using the Lex service
        lex = boto3.client('lex-runtime')
        user_id = "1234"
        bot_name = "photoAlbum"
        # query = "flowers"
        # print("here")
        lex_response = lex.post_text(
            botName=bot_name,
            botAlias="test",
            userId=user_id,
            inputText=query
        )
        # print("lex_response")
        # print("here")
        print("80", lex_response)
        keyWords = []

        # possess the plural
        p = inflect.engine()

        # extract the keyWords from the lex_response
        for key, val in lex_response["slots"].items():

            # if the val is none, the slot is not inputed, do nothing:
            if val is None:
                continue
            else:
                print("here")
                print(p.singular_noun(val))
                if p.singular_noun(val):
                    keyWords.append(p.singular_noun(val))
                if p.plural_noun(val):
                    keyWords.append(p.plural_noun(val))
                keyWords.append(val)

        # using the elastic search to search for the photos
        res = searchPhotos(keyWords)
        print(res, "98")

        # format the response:

        response["isBase64Encoded"] = "false"
        response["statusCode"] = 200
        response["body"] = res["body"]
        print("110", response)

        # update to the front end
        return response

    except Exception as e:
        print("106")
        response['statusCode'] = 400
        response["body"] = "Bad Request"

        return response