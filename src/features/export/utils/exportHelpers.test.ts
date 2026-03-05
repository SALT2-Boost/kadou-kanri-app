import { describe, it, expect } from 'vitest';
import { jsonToCsv } from './exportHelpers';
import type { CsvColumn } from './exportHelpers';

describe('jsonToCsv', () => {
  const columns: CsvColumn[] = [
    { key: 'name', label: '名前' },
    { key: 'age', label: '年齢' },
    { key: 'note', label: '備考' },
  ];

  it('ヘッダー行を正しく生成する', () => {
    const result = jsonToCsv([], columns);
    expect(result).toBe('名前,年齢,備考');
  });

  it('データ行を正しく生成する', () => {
    const data = [
      { name: '田中', age: 30, note: 'メモ' },
    ];
    const result = jsonToCsv(data, columns);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('田中,30,メモ');
  });

  it('null/undefined は空文字になる', () => {
    const data = [
      { name: '田中', age: null, note: undefined },
    ];
    const result = jsonToCsv(data as Record<string, unknown>[], columns);
    const lines = result.split('\n');
    expect(lines[1]).toBe('田中,,');
  });

  it('カンマを含む値はダブルクォートで囲む', () => {
    const data = [
      { name: '田中,太郎', age: 30, note: '' },
    ];
    const result = jsonToCsv(data, columns);
    const lines = result.split('\n');
    expect(lines[1]).toBe('"田中,太郎",30,');
  });

  it('ダブルクォートを含む値はエスケープする', () => {
    const data = [
      { name: '田中"太郎"', age: 30, note: '' },
    ];
    const result = jsonToCsv(data, columns);
    const lines = result.split('\n');
    expect(lines[1]).toBe('"田中""太郎""",30,');
  });

  it('改行を含む値はダブルクォートで囲む', () => {
    const data = [
      { name: '田中\n太郎', age: 30, note: '' },
    ];
    const result = jsonToCsv(data, columns);
    const lines = result.split('\n');
    expect(lines[1]).toBe('"田中');
    expect(lines[2]).toBe('太郎",30,');
  });

  it('複数行のデータを正しく生成する', () => {
    const data = [
      { name: '田中', age: 30, note: 'A' },
      { name: '鈴木', age: 25, note: 'B' },
    ];
    const result = jsonToCsv(data, columns);
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('名前,年齢,備考');
    expect(lines[1]).toBe('田中,30,A');
    expect(lines[2]).toBe('鈴木,25,B');
  });

  it('存在しないキーは空文字になる', () => {
    const data = [
      { name: '田中' },
    ];
    const result = jsonToCsv(data as Record<string, unknown>[], columns);
    const lines = result.split('\n');
    expect(lines[1]).toBe('田中,,');
  });
});
