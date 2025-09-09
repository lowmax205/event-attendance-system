/**
 * Custom ESLint rule: no-legacy-colors
 * Forbids usage of old bespoke Tailwind utility class patterns that bypass theme tokens.
 * Enforced patterns derive from tailwind.config.js & index.css tokens.
 *
 * Disallowed examples (case-sensitive class tokens or substrings):
 *  - bg-background-light / bg-background-dark
 *  - text-foreground-light / text-foreground-dark
 *  - bg-card-light / bg-card-dark
 *  - border-border-light / border-border-dark
 *  - Any class ending in -light or -dark following bg-, text-, border-, shadow-, ring-, outline-
 *  - Hard-coded hex colors (e.g., #ffffff, #FFF, #1a2b3c) in className strings or style props
 *
 * Allowed: official design tokens: bg-background, text-foreground, bg-card, etc.
 */

const HEX_REGEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/;
const LEGACY_CLASS_REGEX = /(bg|text|border|shadow|ring|outline)-[a-zA-Z0-9]*-(light|dark)\b/;
const SPECIFIC_FORBIDDEN = [
  'bg-background-light',
  'bg-background-dark',
  'text-foreground-light',
  'text-foreground-dark',
  'bg-card-light',
  'bg-card-dark',
  'border-border-light',
  'border-border-dark',
];

function reportIfLegacy(context, node, value) {
  if (typeof value !== 'string') return;
  // Quick skip if no suspicious substrings
  if (!value.includes('light') && !value.includes('dark') && !value.includes('#')) return;

  // Split on whitespace to inspect classes
  const classes = value.split(/\s+/);
  for (const cls of classes) {
    if (SPECIFIC_FORBIDDEN.includes(cls) || LEGACY_CLASS_REGEX.test(cls)) {
      context.report({
        node,
        message: `Legacy color utility "${cls}" is forbidden. Use design tokens (e.g., bg-background, text-muted-foreground).`,
      });
    }
  }
  // Hex color usage inside className value (rare but catch style="... #fff ...")
  if (HEX_REGEX.test(value)) {
    context.report({
      node,
      message: 'Hard-coded hex color detected. Use semantic Tailwind token classes instead.',
    });
  }
}

export const rules = {
  'no-legacy-colors': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Disallow legacy light/dark color utilities and raw hex colors in JSX className/style',
        recommended: false,
      },
      schema: [],
      messages: {},
    },
    create(context) {
      return {
        JSXAttribute(node) {
          if (node.name && node.name.name === 'className') {
            if (node.value) {
              if (node.value.type === 'Literal') {
                reportIfLegacy(context, node, node.value.value);
              } else if (node.value.type === 'JSXExpressionContainer') {
                const expr = node.value.expression;
                if (expr.type === 'Literal' && typeof expr.value === 'string') {
                  reportIfLegacy(context, node, expr.value);
                }
                // TemplateLiteral: gather raw quasis
                if (expr.type === 'TemplateLiteral') {
                  const raw = expr.quasis.map((q) => q.value.cooked).join(' ');
                  reportIfLegacy(context, node, raw);
                }
              }
            }
          }
          // Detect inline style with hex colors: style={{ color: '#fff' }}
          if (
            node.name &&
            node.name.name === 'style' &&
            node.value &&
            node.value.type === 'JSXExpressionContainer'
          ) {
            const expr = node.value.expression;
            if (expr.type === 'ObjectExpression') {
              expr.properties.forEach((prop) => {
                if (prop.type === 'Property') {
                  const val = prop.value;
                  if (
                    val.type === 'Literal' &&
                    typeof val.value === 'string' &&
                    HEX_REGEX.test(val.value)
                  ) {
                    context.report({
                      node: prop,
                      message:
                        'Hard-coded hex color in inline style. Use design tokens or Tailwind classes.',
                    });
                  }
                }
              });
            }
          }
        },
        // Simple string literal scan (e.g., const cls = 'bg-background-light px-4')
        Literal(node) {
          if (typeof node.value === 'string') {
            if (
              SPECIFIC_FORBIDDEN.some((f) => node.value.includes(f)) ||
              LEGACY_CLASS_REGEX.test(node.value)
            ) {
              reportIfLegacy(context, node, node.value);
            } else if (HEX_REGEX.test(node.value)) {
              // Only flag hex if class-like or style-related context? Keep broad to catch early.
              context.report({
                node,
                message: 'Hard-coded hex color detected. Replace with semantic Tailwind token.',
              });
            }
          }
        },
      };
    },
  },
};

export default { rules };
