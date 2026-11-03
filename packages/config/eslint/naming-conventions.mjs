const CAMEL_CASE = /^[a-z][A-Za-z0-9]*$/;
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const UPPER_SNAKE_CASE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

function bindingIdentifiers(pattern, results = []) {
  if (!pattern) return results;
  if (pattern.type === 'Identifier') results.push(pattern);
  else if (pattern.type === 'RestElement') bindingIdentifiers(pattern.argument, results);
  else if (pattern.type === 'AssignmentPattern') bindingIdentifiers(pattern.left, results);
  else if (pattern.type === 'ArrayPattern')
    pattern.elements.forEach((item) => bindingIdentifiers(item, results));
  else if (pattern.type === 'ObjectPattern') {
    pattern.properties.forEach((property) => {
      if (property.type === 'RestElement') bindingIdentifiers(property.argument, results);
      else bindingIdentifiers(property.value, results);
    });
  }
  return results;
}

function containsJsx(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return true;
  for (const [key, value] of Object.entries(node)) {
    if (
      key === 'parent' ||
      key === 'loc' ||
      key === 'range' ||
      key === 'tokens' ||
      key === 'comments'
    )
      continue;
    if (Array.isArray(value) ? value.some(containsJsx) : containsJsx(value)) return true;
  }
  return false;
}

function isExportedConstant(node, sourceCode, filename) {
  if (/(?:^|[\\/])tests[\\/]|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(filename)) return false;
  const declaration = node.parent;
  if (declaration?.kind !== 'const') return false;
  const ancestors = sourceCode.getAncestors(node);
  const declarationIndex = ancestors.findIndex(
    (ancestor) => ancestor.type === 'VariableDeclaration',
  );
  const statement = declarationIndex > 0 ? ancestors[declarationIndex - 1] : undefined;
  return statement?.type === 'Program' || statement?.type === 'ExportNamedDeclaration';
}

function isLiteralConstant(node) {
  return (
    node?.type === 'Literal' ||
    [
      'BooleanLiteral',
      'NumericLiteral',
      'StringLiteral',
      'BigIntLiteral',
      'RegExpLiteral',
    ].includes(node?.type)
  );
}

function isValidIdentifier(name, convention) {
  if (name === '_' && convention === 'camelCase') return true;
  if (name.startsWith('_')) return isValidIdentifier(name.slice(1), convention);
  if (convention === 'pascalCase') return PASCAL_CASE.test(name);
  if (convention === 'upperSnakeCase') return UPPER_SNAKE_CASE.test(name);
  return CAMEL_CASE.test(name);
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce the repository symbol naming conventions',
    },
    schema: [],
    messages: {
      invalidName: '{{name}} must use {{convention}} naming for {{kind}}.',
    },
  },
  create(context) {
    function check(node, convention, kind) {
      const name = node?.name;
      if (typeof name === 'string' && !isValidIdentifier(name, convention)) {
        context.report({
          node,
          messageId: 'invalidName',
          data: { name, convention, kind },
        });
      }
    }

    function checkParameters(params) {
      for (const parameter of params ?? []) {
        for (const identifier of bindingIdentifiers(parameter)) {
          check(identifier, 'camelCase', 'parameter');
        }
      }
    }

    function checkFunction(node) {
      const convention = containsJsx(node.body) ? 'pascalCase' : 'camelCase';
      if (node.id) check(node.id, convention, containsJsx(node.body) ? 'component' : 'function');
      checkParameters(node.params);
    }

    return {
      ClassDeclaration(node) {
        if (node.id) check(node.id, 'pascalCase', 'class');
      },
      ClassExpression(node) {
        if (node.id) check(node.id, 'pascalCase', 'class');
      },
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression(node) {
        checkParameters(node.params);
      },
      VariableDeclarator(node) {
        const jsxComponent = containsJsx(node.init);
        const classValue = node.init?.type === 'ClassExpression';
        const exportedLiteralConstant =
          isExportedConstant(node, context.sourceCode, context.filename) &&
          isLiteralConstant(node.init);
        const conventions = exportedLiteralConstant
          ? ['upperSnakeCase']
          : jsxComponent || classValue
            ? ['pascalCase']
            : ['camelCase', 'upperSnakeCase'];
        for (const identifier of bindingIdentifiers(node.id)) {
          const externalPascalBinding =
            node.id.type === 'ObjectPattern' &&
            node.id.properties.some(
              (property) =>
                property.type === 'Property' &&
                property.key.type === 'Identifier' &&
                property.value.type === 'Identifier' &&
                property.value.name === identifier.name &&
                PASCAL_CASE.test(property.key.name),
            );
          const valid =
            externalPascalBinding ||
            conventions.some((convention) => isValidIdentifier(identifier.name, convention));
          if (!valid) {
            context.report({
              node: identifier,
              messageId: 'invalidName',
              data: {
                name: identifier.name,
                convention: conventions.join(' or '),
                kind: exportedLiteralConstant
                  ? 'constant'
                  : jsxComponent
                    ? 'component'
                    : 'variable',
              },
            });
          }
        }
      },
      TSInterfaceDeclaration(node) {
        check(node.id, 'pascalCase', 'interface');
      },
      TSTypeAliasDeclaration(node) {
        check(node.id, 'pascalCase', 'type');
      },
      TSEnumDeclaration(node) {
        check(node.id, 'pascalCase', 'enum');
      },
      TSTypeParameter(node) {
        check(node.name, 'pascalCase', 'type parameter');
      },
      MethodDefinition(node) {
        if (!node.computed && node.key.type === 'Identifier' && node.kind !== 'constructor') {
          check(node.key, 'camelCase', 'class method');
        }
      },
      PropertyDefinition(node) {
        if (!node.computed && node.key.type === 'Identifier')
          check(node.key, 'camelCase', 'class field');
      },
      TSMethodSignature(node) {
        if (node.key.type === 'Identifier') check(node.key, 'camelCase', 'interface method');
      },
      TSPropertySignature(node) {
        if (node.key.type === 'Identifier') check(node.key, 'camelCase', 'interface field');
      },
    };
  },
};
