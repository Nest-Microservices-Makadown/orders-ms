import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT: number,
    PRODUCTS_MS_HOST: string,
    PRODUCTS_MS_PORT: number
}

const envsSchema = joi.object<EnvVars>({
    PORT: joi.number().required(),
    PRODUCTS_MS_HOST: joi.string().required(),
    PRODUCTS_MS_PORT: joi.number().required()
}).unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    PORT: envVars.PORT,
    PRODUCTS_MS_HOST: envVars.PRODUCTS_MS_HOST,
    PRODUCTS_MS_PORT: envVars.PRODUCTS_MS_PORT
}
