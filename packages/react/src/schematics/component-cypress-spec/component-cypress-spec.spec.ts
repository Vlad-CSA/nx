import { externalSchematic, Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { callRule, runSchematic } from '../../utils/testing';
import { CreateComponentSpecFileSchema } from './component-cypress-spec';
import { stripIndents } from '@angular-devkit/core/src/utils/literals';

describe('react:component-cypress-spec', () => {
  let appTree: Tree;
  let tree: UnitTestTree;
  let cmpPath = 'libs/test-ui-lib/src/lib/test-ui-lib.tsx';
  let cypressStorySpecFilePath =
    'apps/test-ui-lib-e2e/src/integration/test-ui-lib/test-ui-lib.spec.ts';

  beforeEach(async () => {
    appTree = await createTestUILib('test-ui-lib');

    appTree.overwrite(
      cmpPath,
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

    tree = await runSchematic(
      'component-cypress-spec',
      <CreateComponentSpecFileSchema>{
        componentPath: 'lib/test-ui-lib.tsx',
        project: 'test-ui-lib'
      },
      appTree
    );
  });

  it('should create the component spec', () => {
    expect(tree.exists(cypressStorySpecFilePath)).toBeTruthy();
  });

  it('should properly set up the spec', () => {
    expect(stripIndents`${tree.readContent(cypressStorySpecFilePath)}`)
      .toContain(stripIndents`describe('test-ui-lib: Test component', () => {
  beforeEach(() => cy.visit('/iframe.html?id=test--primary&knob-name=&knob-displayAge=false'));
  
  it('should render the component', () => {
    cy.get('h1').should('contain', 'Welcome to test-ui-lib component!');
  });
});
`);
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
