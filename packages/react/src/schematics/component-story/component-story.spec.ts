import { externalSchematic, Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { callRule, runSchematic } from '../../utils/testing';
import { CreateComponentStoriesFileSchema } from './component-story';

describe('react:component-story', () => {
  let appTree: Tree;
  let tree: UnitTestTree;
  let cmpPath = 'libs/test-ui-lib/src/lib/test-ui-lib.tsx';
  let storyFilePath = 'libs/test-ui-lib/src/lib/test-ui-lib.stories.tsx';

  beforeEach(async () => {
    appTree = await createTestUILib('test-ui-lib');
  });

  describe('default component setup', () => {
    beforeEach(async () => {
      tree = await runSchematic(
        'component-story',
        <CreateComponentStoriesFileSchema>{
          componentPath: 'lib/test-ui-lib.tsx',
          project: 'test-ui-lib'
        },
        appTree
      );
    });

    it('should create the story file', () => {
      expect(tree.exists(storyFilePath)).toBeTruthy();
    });

    it('should properly set up the story', () => {
      expect(tree.readContent(storyFilePath))
        .toContain(`import React from 'react';
import { TestUiLib, TestUiLibProps } from './test-ui-lib';

export default {
  component: TestUiLib,
  title: 'TestUiLib'
};

export const primary = () => {
  const props: TestUiLibProps = {};

  return <TestUiLib />;
};`);
    });
  });

  describe('component with props', () => {
    beforeEach(async () => {
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
        'component-story',
        <CreateComponentStoriesFileSchema>{
          componentPath: 'lib/test-ui-lib.tsx',
          project: 'test-ui-lib'
        },
        appTree
      );
    });

    it('should setup knobs based on the component props', () => {
      expect(tree.readContent(storyFilePath))
        .toContain(`import { text, boolean } from '@storybook/addon-knobs';
import React from 'react';
import { Test, TestProps } from './test-ui-lib';

export default {
  component: Test,
  title: 'Test'
};

export const primary = () => {
  const props: TestProps = {
    name: text('name', ''),
    displayAge: boolean('displayAge', false)
  };

  return <Test name={props.name} displayAge={props.displayAge} />;
};
`);
    });
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
  return appTree;
}
