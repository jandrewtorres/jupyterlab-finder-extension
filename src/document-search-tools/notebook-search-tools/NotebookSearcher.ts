import {
  IObservableList,
  IObservableUndoableList
} from '@jupyterlab/observables';
import { ICellModel } from '@jupyterlab/cells';
import { each } from '@phosphor/algorithm';
import { ISignal, Signal } from '@phosphor/signaling';
import { NotebookPanel } from '@jupyterlab/notebook';
import { SearchTools } from '../SearchTools';
import { NotebookSearchTools } from './NotebookSearchTools';
import INotebookMatch = NotebookSearchTools.INotebookMatch;

export class NotebookSearcher
  implements SearchTools.IDocumentSearcher<NotebookPanel> {
  constructor(cells: IObservableUndoableList<ICellModel>) {
    // Create CellWithMatches list from Cell list.
    each(cells, (cell: ICellModel) => {
      const searchableCell = new CellSearcher(cell);

      // Listen for updates to matches from cells.
      searchableCell.changed.connect((cell, args) => {
        this._onCellChanged(cell);
      });

      this._cells.push(searchableCell);
    });

    // Watch for list changes like add and remove cell.
    cells.changed.connect((sender, args) => {
      this._onCellListChanged(args);
    });
  }

  set query(query: string) {
    each(this._cells, (cell: CellSearcher) => {
      cell.query = query;
    });
    this._changed.emit(void 0);
  }

  get changed() {
    return this._changed;
  }

  get matches(): INotebookMatch[] {
    let matches: INotebookMatch[] = [];
    each(this._cells, (cell: CellSearcher) => {
      matches = matches.concat(cell.matches);
    });
    return matches;
  }

  private _onCellListChanged(args: IObservableList.IChangedArgs<ICellModel>) {
    if (args.type === 'add') {
      this._cells.splice(args.newIndex, 0, new CellSearcher(args.newValues[0]));
    } else if (args.type === 'remove') {
      this._cells.splice(args.oldIndex, 1);
    }
    this._changed.emit(void 0);
  }

  private _onCellChanged(cell: CellSearcher) {
    this._changed.emit(void 0);
  }

  private _cells: CellSearcher[] = [];
  private _changed = new Signal<this, void>(this);
}

export class CellSearcher {
  constructor(cell: ICellModel) {
    this._cell = cell;
    this._cell.value.changed.connect((sender, args) => {
      this._refreshMatches();
      this._changed.emit(void 0);
    });
  }

  set query(query: string) {
    this._query = query;
    this._refreshMatches();
  }

  get changed(): ISignal<this, void> {
    return this._changed;
  }

  get matches(): INotebookMatch[] {
    return this._matches;
  }

  private _refreshMatches(): void {
    this._matches = [];
    if (this._query.length === 0) {
      return;
    }
    let re = new RegExp(this._query, 'g');
    let match;
    do {
      match = re.exec(this._cell.value.text);
      if (match) {
        this._matches.push({
          documentType: 'notebook',
          start: match.index,
          end: match.index + this._query.length,
          cellID: this._cell.id
        });
      }
    } while (match);
  }

  private _cell: ICellModel;
  private _query: string = '';
  private _matches: INotebookMatch[] = [];
  private _changed = new Signal<this, void>(this);
}