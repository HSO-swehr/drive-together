import { createEslintConfig } from '../config/eslint.shared.js';

export default createEslintConfig({
  sourceFiles: '{src,tests}/**/*.ts',
});
