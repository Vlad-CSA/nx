import { normalize } from '@angular-devkit/core';
import {
  chain,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  applyTemplates,
  Tree,
  url
} from '@angular-devkit/schematics';
import { findNodes, getProjectConfig } from '@nrwl/workspace';
import { applyWithSkipExisting } from '@nrwl/workspace/src/utils/ast-utils';
import { join } from 'path';
import ts = require('typescript');

export interface CreateComponentSpecFileSchema {
  project: string;
  componentPath: string;
}

export default function(schema: CreateComponentSpecFileSchema): Rule {
  return chain([createComponentSpecFile(schema)]);
}

// TODO: candidate to refactor with the angular component story
export function getKnobDefaultValue(property: ts.SyntaxKind): string {
  const typeNameToDefault: Record<number, any> = {
    [ts.SyntaxKind.StringKeyword]: '',
    [ts.SyntaxKind.NumberKeyword]: 0,
    [ts.SyntaxKind.BooleanKeyword]: false
  };

  const resolvedValue = typeNameToDefault[property];
  if (typeof resolvedValue === undefined) {
    return '';
  } else {
    return resolvedValue;
  }
}

export function createComponentSpecFile({
  project,
  componentPath
}: CreateComponentSpecFileSchema): Rule {
  return (tree: Tree, context: SchematicContext): Rule => {
    const e2eLibIntegrationFolderPath =
      getProjectConfig(tree, project + '-e2e').sourceRoot + '/integration';

    const proj = getProjectConfig(tree, project);
    const componentFilePath = normalize(join(proj.sourceRoot, componentPath));
    const componentName = componentFilePath
      .slice(componentFilePath.lastIndexOf('/') + 1)
      .replace('.tsx', ''); //TODO: what about pure *.js files?

    const contents = tree.read(componentFilePath);
    if (!contents) {
      throw new SchematicsException(`Failed to read ${componentFilePath}`);
    }

    const sourceFile = ts.createSourceFile(
      componentFilePath,
      contents.toString(),
      ts.ScriptTarget.Latest,
      true
    );

    const cmpDeclaration: ts.VariableDeclaration = findNodes(
      sourceFile,
      ts.SyntaxKind.VariableDeclaration
    ).find(
      x => !!findNodes(x, ts.SyntaxKind.JsxElement)
    ) as ts.VariableDeclaration;

    let propsTypeName: string = '';
    let props: {
      name: string;
      defaultValue: any;
    }[] = [];

    // find PropsType
    if (ts.isArrowFunction(cmpDeclaration.initializer)) {
      const propsParam: ts.ParameterDeclaration = cmpDeclaration.initializer.parameters.find(
        x => ts.isParameter(x) && (x.name as ts.Identifier).text === 'props'
      );

      propsTypeName = ((propsParam.type as ts.TypeReferenceNode)
        .typeName as ts.Identifier).text;

      const propsInterface: ts.InterfaceDeclaration = findNodes(
        sourceFile,
        ts.SyntaxKind.InterfaceDeclaration
      ).find((x: ts.InterfaceDeclaration) => {
        return (x.name as ts.Identifier).getText() === propsTypeName;
      }) as ts.InterfaceDeclaration;

      if (propsInterface) {
        props = propsInterface.members.map((member: ts.PropertySignature) => {
          return {
            name: (member.name as ts.Identifier).text,
            defaultValue: getKnobDefaultValue(member.type.kind)
          };
        });
      }
    }

    return applyWithSkipExisting(url('./files'), [
      applyTemplates({
        projectName: project,
        componentName,
        componentSelector: (cmpDeclaration.name as ts.Identifier).text,
        props
      }),
      move(e2eLibIntegrationFolderPath + '/' + componentName)
    ]);
  };
}
