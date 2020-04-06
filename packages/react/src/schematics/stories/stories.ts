import {
  chain,
  Rule,
  schematic,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';
import { getProjectConfig } from '@nrwl/workspace';
import { join } from 'path';
import { CreateComponentStoriesFileSchema } from '../component-story/component-story';

export interface StorybookStoriesSchema {
  project: string;
  generateCypressSpecs: boolean;
}

export function createAllStories(
  projectName: string,
  generateCypressSpecs: boolean
): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('adding .storybook folder to lib');

    const projectSrcRoot = getProjectConfig(tree, projectName).sourceRoot;
    const libPath = join(projectSrcRoot, '/lib');

    let componentPaths: string[] = [];
    tree.getDir(libPath).visit(filePath => {
      if (filePath.endsWith('.tsx') && !filePath.endsWith('.spec.tsx')) {
        componentPaths.push(filePath);
      }
    });

    return chain(
      componentPaths.map(componentPath => {
        const relativeCmpDir = componentPath.replace(
          join('/', projectSrcRoot, '/'),
          ''
        );

        return schematic<CreateComponentStoriesFileSchema>('component-story', {
          componentPath: relativeCmpDir,
          project: projectName
        });
      })
    );
  };
}

export default function(schema: StorybookStoriesSchema): Rule {
  return chain([createAllStories(schema.project, schema.generateCypressSpecs)]);
}
