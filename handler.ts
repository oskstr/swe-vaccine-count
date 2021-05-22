import { APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import { get } from 'table-scraper'
import { VaccineEntry } from './VaccineEntry'

const VACCINE_URL = 'https://www.folkhalsomyndigheten.se/smittskydd-beredskap/utbrott/aktuella-utbrott/covid-19/statistik-och-analyser/statistik-over-registrerade-vaccinationer-covid-19/'

const db = new DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    apiVersion: '2012-08-10'
})

export const vaccineCount = async (): Promise<APIGatewayProxyResult> => 
    get(VACCINE_URL)
        .then(([_, table]) => 
            table.map((day: any) => new VaccineEntry(day)))
        .then(async ([result]) => {
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
        .then((data: { newDate: boolean } & VaccineEntry) => {
            return {
                statusCode: 200,
                body: JSON.stringify(data)
            }
        })