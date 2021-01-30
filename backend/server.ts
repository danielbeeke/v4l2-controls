import { Application, Router, Response } from 'https://deno.land/x/oak/mod.ts'
import { oakCors } from "https://deno.land/x/cors/mod.ts";

const HOST = '0.0.0.0'
const PORT = 7700

const app = new Application()

app.use(
  oakCors({
    origin: "*"
  }),
);

type Status = {
  [key: string]: {
    [key: string]: number | string,
  }
}

const availableProperties = [
  "brightness",
  "contrast",
  "saturation",
  "hue",
  "white_balance_temperature_auto",
  "gamma",
  "gain",
  "power_line_frequency",
  "white_balance_temperature",
  "sharpness",
  "backlight_compensation",
  "exposure_auto",
  "exposure_absolute",
  "focus_absolute",
  "focus_auto"
]

const status = async ({ params, response }: { response: Response, params: { camera: string } }) => { 
  const process = Deno.run({ cmd: `v4l2-ctl -l --device /dev/video${parseInt(params.camera)}`.split(' '), stdout: 'piped', stderr: 'piped' });
  const output = await process.output()
  process.close()
  let outStr = new TextDecoder().decode(output)
  outStr = outStr.replace(/  +/g, ' ')
  const lines = outStr.split('\n')

  const status: Status = {}

  for (const line of lines) {
    const pieces = line.split(' ')
    if (pieces[1]) {
      const propertyName = pieces[1]
      status[propertyName] = {
        'type': pieces[3].substr(1, pieces[3].length - 2)
      }

      const properties = [pieces[5], pieces[6], pieces[7], pieces[8], pieces[9]]
      for (const propertyString of properties) {
        const split = propertyString?.split('=')
        if (split?.length) {
          status[propertyName][split[0]] = parseInt(split[1])
        }
      }
    }
  }

  response.body = status
}

const api = ({ params, response }: { response: Response, params: { property: string, value: string } }) => { 
  if (!availableProperties.includes(params.property)) throw new Error(`Unknow property: ${params.property}`)        
  Deno.run({ cmd: `v4l2-ctl -c ${params.property}=${parseInt(params.value)} --device /dev/video2`.split(' '), stdout: 'piped', stderr: 'piped' });
  response.status = 200
}


const router = new Router()
router.get('/status/:camera', status)
router.get('/set/:camera/:property/:value', api)
app.use(router.routes())
app.use(router.allowedMethods())

console.log(`Listening on port ${PORT} ...`)
await app.listen(`${HOST}:${PORT}`)
