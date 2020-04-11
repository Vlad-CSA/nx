import { Tree, externalSchematic } from '@angular-devkit/schematics';
import { runSchematic, callRule } from '../../utils/testing';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
import { StorybookStoriesSchema } from './stories';

describe('react:stories', () => {
  let appTree: Tree;
  let tree: UnitTestTree;

  beforeEach(async () => {
    appTree = await createTestUILib('test-ui-lib');

    // create another component
    appTree.create(
      'libs/test-ui-lib/src/lib/anothercmp/another-cmp.tsx',
      `import React from 'react';

      import './test.scss';
      
      export interface TestProps {
        name: string;
        displayAge: boolean;
      }
      
      export const Test = (props: TestProps) => {
        return (
          <div>
            <h1>Welcome to test component, {props.name}</h1>
          </div>
        );
      };
      
      export default Test;        
      `
    );
  });

  it('should create the stories', async () => {
    tree = await runSchematic(
      'stories',
      <StorybookStoriesSchema>{
        project: 'test-ui-lib'
      },
      appTree
    );

    expect(
      tree.exists('libs/test-ui-lib/src/lib/test-ui-lib.stories.tsx')
    ).toBeTruthy();
    expect(
      tree.exists('libs/test-ui-lib/src/lib/anothercmp/another-cmp.stories.tsx')
    ).toBeTruthy();
  });

  it('should generate Cypress specs', async () => {
    tree = await runSchematic(
      'stories',
      <StorybookStoriesSchema>{
        project: 'test-ui-lib',
        generateCypressSpecs: true
      },
      appTree
    );

    expect(
      tree.exists(
        'apps/test-ui-lib-e2e/src/integration/test-ui-lib/test-ui-lib.spec.ts'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        'apps/test-ui-lib-e2e/src/integration/another-cmp/another-cmp.spec.ts'
      )
    ).toBeTruthy();
  });
});

export async function createTestUILib(libName: string): Promise<Tree> {
  let appTree = Tree.empty();
  appTree = createEmptyWorkspace(appTree);
  appTree = await callRule(
    externalSchematic('@nrwl/react', 'library', {
      name: libName
    }),
    appTree
  );

  // create some Nx app that we'll use to generate the cypress
  // spec into it. We don't need a real Cypress setup
  appTree = await callRule(
    externalSchematic('@nrwl/react', 'application', {
      name: `${libName}-e2e`
    }),
    appTree
  );
  return appTree;
}
