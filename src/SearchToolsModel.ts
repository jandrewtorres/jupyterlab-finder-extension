import { VDomModel } from '@jupyterlab/apputils';
import { Widget } from '@phosphor/widgets';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ApplicationShell } from '@jupyterlab/application';
import { SearchToolsFactoryProducer } from './SearchToolsFactory';
import { SearchTools } from './document-search-tools/SearchTools';

export class SearchToolsModel extends VDomModel {
  _currentWidget: SearchToolsModel.ICurrentWidget<any>;
  _docManager: IDocumentManager;
  _notebookTracker: INotebookTracker;
  _shell: ApplicationShell;

  constructor(options: SearchToolsModel.IOptions) {
    super();
    this._docManager = options.docManager;
    this._notebookTracker = options.notebookTracker;
    this._shell = options.shell;

    this.currentWidget = this._shell.currentWidget;
    this._shell.currentChanged.connect((sender, args) => {
      this.currentWidget = this._shell.currentWidget;
    });
  }

  set currentWidget(widget: Widget | null) {
    const type = this._docManager.contextForWidget(widget).contentsModel.type;
    if (type === 'notebook') {
      this._currentWidget = {
        widget: widget as NotebookPanel,
        tools: SearchToolsFactoryProducer.getFactory(type).createSearchTools(
          widget as NotebookPanel
        )
      };
    }
  }

  set query(query: string) {
    this._currentWidget.tools.query = query;
  }
}

export namespace SearchToolsModel {
  export interface IOptions {
    shell: ApplicationShell;
    docManager: IDocumentManager;
    notebookTracker: INotebookTracker;
  }

  export interface ICurrentWidget<T> {
    widget: T;
    tools: SearchTools.IDocumentSearchTools<any>;
  }
}