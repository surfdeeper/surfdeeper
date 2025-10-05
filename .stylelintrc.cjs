module.exports = {
  defaultSeverity: 'warning',
  extends: [
    'stylelint-config-standard'
  ],
  overrides: [
    {
      files: ['**/*.astro'],
      customSyntax: 'postcss-html'
    }
  ],
  rules: {
    'color-hex-length': 'short',
    'color-named': 'never',
    'declaration-no-important': null,
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
    'import-notation': null,
    'media-feature-range-notation': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'font-size', 'z-index', 'box-shadow'],
      {
        ignoreValues: ['inherit', 'transparent', 'currentColor', 'none', '0', 'auto', 'initial'],
        disableFix: true,
        severity: 'warning'
      }
    ],
    'function-disallowed-list': [
      ['rgb', 'rgba', 'hsl', 'hsla'],
      { message: 'Use design tokens via var(--...) instead of raw color functions.' }
    ],
  },
  plugins: [
    'stylelint-declaration-strict-value'
  ]
};
