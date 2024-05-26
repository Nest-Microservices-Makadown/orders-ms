import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT: number,
    // GATEWAY_MS_HOST: string,
    // GATEWAY_MS_PORT: number
}

const envsSchema = joi.object<EnvVars>({
    PORT: joi.number().required(),
    // GATEWAY_MS_HOST: joi.string().required(),
    // GATEWAY_MS_PORT: joi.number().required()
}).unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    PORT: envVars.PORT,
    // GATEWAY_MS_HOST: envVars.GATEWAY_MS_HOST,
    // GATEWAY_MS_PORT: envVars.GATEWAY_MS_PORT
}
