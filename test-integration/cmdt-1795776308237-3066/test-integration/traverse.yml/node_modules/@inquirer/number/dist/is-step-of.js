function toDecimal(value) {
    const [coefficient = '', exponent = '0'] = value.toString().toLowerCase().split('e');
    const [integer = '', fraction = ''] = coefficient.split('.');
    return {
        significand: BigInt(`${integer}${fraction}`),
        exponent: Number(exponent) - fraction.length,
    };
}
export function isStepOf(value, step, min) {
    if (!Number.isFinite(value) || !Number.isFinite(step) || step === 0) {
        return false;
    }
    const valueDecimal = toDecimal(value);
    const stepDecimal = toDecimal(step);
    const minDecimal = Number.isFinite(min) ? toDecimal(min) : undefined;
    const exponent = Math.min(valueDecimal.exponent, stepDecimal.exponent, minDecimal?.exponent ?? Infinity);
    const toInteger = (decimal) => decimal.significand * 10n ** BigInt(decimal.exponent - exponent);
    const valueInteger = toInteger(valueDecimal);
    const stepInteger = toInteger(stepDecimal);
    const minInteger = minDecimal ? toInteger(minDecimal) : 0n;
    return (valueInteger - minInteger) % stepInteger === 0n;
}
