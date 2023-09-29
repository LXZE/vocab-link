import 'fake-indexeddb/auto';

import { get } from 'svelte/store';
import { render, screen, fireEvent } from '@testing-library/svelte';
import WordNote from '@/components/word-note.svelte';
import { selectedNode, selectedNodeId } from '@/lib/store';
import { wordDB } from '@/lib/graph-db';
import { NodeType } from '@/utils/const';


describe(`Test ${WordNote.name}`, () => {
  const TEST_NODE_ID = 'test_node_id_1';

  beforeEach(async () => {
    selectedNode.set(undefined);
    await wordDB.deleteWordNoteById(TEST_NODE_ID);
  });

  it('Can render and bind value from db correctly', async () => {
    const node = {
      id: TEST_NODE_ID, text: '',
      type: NodeType.Word, createdAt: 0,
    };
    // add initial data in db
    await wordDB.updateWordNoteById(TEST_NODE_ID, 'test text');
    await expect(wordDB.getWordNoteById(TEST_NODE_ID)).resolves.toEqual('test text');

    // render and set selected node
    render(WordNote);
    selectedNode.set(node);
    expect(get(selectedNodeId)).toEqual(node.id);

    // check if data show in screen
    const textarea = await screen.findByDisplayValue('test text');
    expect(textarea).toBeVisible();
  });

  it('Can type in text area to update db', async () => {
    const node = {
      id: TEST_NODE_ID, text: '',
      type: NodeType.Word, createdAt: 0,
    };
    // check if no word note at start
    await expect(wordDB.getWordNoteById(TEST_NODE_ID)).resolves.toEqual('');

    // set selected Node
    const { container } = render(WordNote);
    selectedNode.set(node);
    expect(get(selectedNodeId)).toEqual(node.id);

    // add text
    const textarea = container.querySelector<HTMLTextAreaElement>('textarea.textarea')!;
    await fireEvent.change(textarea, { target: { value: 'test text' } });

    // check if db changed
    setTimeout(async () => {
      await expect(wordDB.getWordNoteById(TEST_NODE_ID)).resolves.toEqual('test text');
    }, 200); // debounced
  });
});