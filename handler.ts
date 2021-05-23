import { APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
// @ts-ignore
import { get } from 'table-scraper'
import { VaccineEntry } from './VaccineEntry'
const Twitter = require('twitter')

const VACCINE_URL = 'https://www.folkhalsomyndigheten.se/smittskydd-beredskap/utbrott/aktuella-utbrott/covid-19/statistik-och-analyser/statistik-over-registrerade-vaccinationer-covid-19/'

const db = new DynamoDB.DocumentClient({ apiVersion: '2012-08-10' })

const twitter = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
})

export const vaccineCount = async (): Promise<APIGatewayProxyResult> => 
    get(VACCINE_URL)
        .then(([_, table]: [any, any]) => 
            table.map((day: any) => new VaccineEntry(day)))
        .then(async ([result]: [VaccineEntry]) => {
            const data = await db.put({
                TableName: 'vaccineCount',
                Item: {
                    mostRecent: 'mostRecent',
                    date: result.date
                },
                ReturnValues: 'ALL_OLD'
            }).promise()      

            const oldDate = data.Attributes ? data.Attributes.date : null

            return {
                newDate: result.date !== oldDate,
                ...result
            }   
        })
        .then(async (data: { newDate: boolean } & VaccineEntry) => {
            if (data.newDate) {
                const tweet = {status: `${data.graph}\n${data.text}`}
                return twitter.post('statuses/update', tweet)
                        .then((_: any) => {
                            return {
                                statusCode: 200,
                                body: JSON.stringify({
                                    message: "Posted New Tweet",
                                    tweet
                                })
                            }
                        })
            }

            console.log("No new data", data)

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "No new data found",
                    data
                })
            }
        })
        .catch((error: any) => console.error(error))
