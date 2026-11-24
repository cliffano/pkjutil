import { type Theme } from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
type PasswordTheme = {
    style: {
        maskedText: string;
        keysHelpTip: (keys: [key: string, action: string][]) => string | undefined;
    };
};
type PasswordConfig = {
    message: string;
    mask?: boolean | string;
    toggleMask?: boolean;
    validate?: (value: string) => boolean | string | Promise<string | boolean>;
    theme?: PartialDeep<Theme<PasswordTheme>>;
};
declare const _default: import("@inquirer/type").Prompt<string, {
    message: string;
    mask?: boolean | string;
    toggleMask?: boolean;
    validate?: (value: string) => boolean | string | Promise<string | boolean>;
    theme?: PartialDeep<Theme<PasswordTheme>>;
} & PasswordConfig>;
export default _default;
