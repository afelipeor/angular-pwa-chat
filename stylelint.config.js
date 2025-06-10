module.exports = {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-prettier-scss'],
  plugins: ['stylelint-scss'],
  rules: {
    // SCSS specific rules
    'scss/at-rule-no-unknown': true,
    'scss/selector-no-redundant-nesting-selector': true,
    'scss/no-duplicate-dollar-variables': true,
    'scss/dollar-variable-pattern': '^[a-z][a-zA-Z0-9]*(-[a-z][a-zA-Z0-9]*)*$',
    'scss/percent-placeholder-pattern':
      '^[a-z][a-zA-Z0-9]*(-[a-z][a-zA-Z0-9]*)*$',

    // General CSS rules
    'color-hex-case': 'lower',
    'color-hex-length': 'short',
    'declaration-block-trailing-semicolon': 'always',
    'declaration-colon-space-after': 'always',
    'declaration-colon-space-before': 'never',
    'function-comma-space-after': 'always',
    'function-parentheses-space-inside': 'never',
    indentation: 2,
    'max-empty-lines': 1,
    'number-leading-zero': 'always',
    'number-no-trailing-zeros': true,
    'property-case': 'lower',
    'rule-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['after-comment'],
      },
    ],
    'selector-class-pattern': '^[a-z][a-zA-Z0-9]*(-[a-z][a-zA-Z0-9]*)*$',
    'string-quotes': 'single',
    'unit-case': 'lower',

    // Angular specific
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['ng-deep'],
      },
    ],

    // Disable some overly strict rules for Angular
    'no-empty-source': null,
    'scss/at-import-partial-extension': null,
  },
  ignoreFiles: ['dist/**/*', 'node_modules/**/*', 'coverage/**/*'],
};
