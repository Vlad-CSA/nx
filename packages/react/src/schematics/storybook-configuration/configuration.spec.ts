import { externalSchematic, Tree } from '@angular-devkit/schematics';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { callRule, runSchematic } from '../../utils/testing';
import { StorybookConfigureSchema } from './schema';

describe('react:storybook-configuration', () => {
  let appTree;

  beforeEach(async () => {
    appTree = await createTestUILib('test-ui-lib');
  });

  it('should configure everything at once', async () => {
    const tree = await runSchematic(
      'storybook-configuration',
      <StorybookConfigureSchema>{
        name: 'test-ui-lib',
        configureCypress: true
      },
      appTree
    );
    expect(tree.exists('libs/test-ui-lib/.storybook/addons.js')).toBeTruthy();
    expect(tree.exists('libs/test-ui-lib/.storybook/config.js')).toBeTruthy();
    expect(
      tree.exists('libs/test-ui-lib/.storybook/tsconfig.json')
    ).toBeTruthy();
    expect(tree.exists('apps/test-ui-lib-e2e/cypress.json')).toBeTruthy();
  });

  it('should generate stories for components', async () => {
    const tree = await runSchematic(
      'storybook-configuration',
      <StorybookConfigureSchema>{
        name: 'test-ui-lib',
        generateStories: true
      },
      appTree
    );

    expect(
      tree.exists('libs/test-ui-lib/src/lib/test-ui-lib.stories.tsx')
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
  return appTree;
}
