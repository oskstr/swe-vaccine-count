const ONE_DOSE_KEY = 'Andel (%) vaccinerademed minst 1 dos'
const TWO_DOSE_KEY = 'Andel (%) vaccinerademed minst 2 doser'

const LENGTH = 13
const BLOCK = 100/LENGTH

const blocks = (percentage: number) => Math.floor(percentage/BLOCK)
const toFloat = (num: string) => parseFloat(num.replace(",", "."))
const toSwedish = (num: number) => num.toLocaleString('sv')

const RED_SQUARE = '🟥'
const YELLOW_SQUARE = '🟨'
const GREEN_SQUARE = '🟩'

export class VaccineEntry {
    readonly date: string;
    readonly graph: string;
    readonly text: string;

    constructor(result: any) {
        console.log(result)

        this.date = result.Datum
        const oneDose = toFloat(result[ONE_DOSE_KEY])
        const twoDoses = toFloat(result[TWO_DOSE_KEY])

        const twoBlocks = blocks(twoDoses)
        const oneBlocks = blocks(oneDose) - twoBlocks
        const restBlocks = LENGTH - oneBlocks - twoBlocks

        this.graph = GREEN_SQUARE.repeat(twoBlocks) + YELLOW_SQUARE.repeat(oneBlocks) + RED_SQUARE.repeat(restBlocks)
        this.text = `Minst 1 dos: ${toSwedish(oneDose)}%, 2 doser: ${toSwedish(twoDoses)}%`
    }

}


