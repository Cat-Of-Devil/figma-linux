import * as E from "electron";
import * as React from "react";
import { observer, inject } from "mobx-react";
import { toJS } from "mobx";

import * as Const from "Const";
import { isComponentUrl } from "Utils/Common";
import TabList from "./tabs";
import './style.scss'

interface TabsProps {
    tabs?: ITabsStore
}

@inject('tabs')
@observer
class Tabs extends React.Component<TabsProps, {}> {
    props: TabsProps;

    constructor(props: TabsProps) {
        super(props);

        this.props = props;
    }

    private close = (e: React.MouseEvent<any> & Event, id: number) => {
        e.stopPropagation();

        let tabs = toJS(this.props.tabs!.tabs);
        const tab = this.props.tabs.getTab(id);
        const currentTabId: number = toJS(this.props.tabs!.current);
        let index: number = tabs.findIndex(t => t.id === id);

        if (isComponentUrl(tab.url)) {
            E.ipcRenderer.send(Const.MAINTAB);
        } else {
            E.ipcRenderer.send(Const.CLOSETAB, id);
        }

        this.props.tabs.deleteTab(id);

        if (id !== currentTabId) return;

        if (isComponentUrl(tab.url)) {
            this.props.tabs!.setFocus(1);
        } else {
            this.props.tabs!.setFocus(
                index !== 0 ? tabs[index > 0 ? index-1 : index].id : 1
            );
        }
    }

    private clickTab = (e: React.MouseEvent<any> & Event, tab: Tab) => {
        e.stopPropagation();

        switch(e.button) {
            // Handle left click, set focuse on the target tab
            case 0: {
                const tabEl = e.target as any;

                this.focus(e, tab.id);

                // Move tab
                // if (/tab/.test(tabEl.className)) {
                //     const currentTab: Tab = this.props.tabs.tabs.find(t => t.id === tab.id )
                //     const TabContainer = tabEl.parentNode as any;
                //     const TabContainerRect = TabContainer.getBoundingClientRect();
                //     const TabBox = tabEl.getBoundingClientRect();
                //     const BoxXShift = event.pageX - TabBox.left;
                //     let fakeTab: any;
                //     let fakeTabBox: ClientRect | DOMRect;
                //     let fakeTabClassName: string;
                //     let shift = 1;
                //     let isMove = false;

                //     const onMouseMove = (e: MouseEvent) => {
                //         const TabBoxUpdated = tabEl.getBoundingClientRect();
                //         const left = Math.abs(e.pageX - (BoxXShift + TabBox.width));

                //         tabEl.style.position = 'absolute';
                //         tabEl.style.zIndex = '1000';
                //         tabEl.style.height = '28px';

                //         if (!isMove) {
                //             this.props.tabs.updateTab({ ...currentTab, moves: true });
                //             fakeTab = document.getElementsByClassName('fakeTab')[0] as any;
                //             fakeTabBox = fakeTab.getBoundingClientRect();
                //             fakeTabClassName = fakeTab.className;
                //             isMove = true;
                //         }

                //         // left side restriction
                //         if ((e.pageX + (TabBox.left - BoxXShift)) > TabContainerRect.right) {
                //             return;
                //         }

                //         // right side restriction
                //         if ((e.pageX - BoxXShift) < TabContainerRect.left) {
                //             shift += 3;

                //             if (Math.floor((left / shift) < 0 ? 0 : (left / shift)) !== 0) {
                //                 tabEl.style.left = `-${left / shift}px`;
                //             } else {
                //                 tabEl.style.left = `0px`;
                //             }

                //             return;
                //         }

                //         if (TabBoxUpdated.left > fakeTabBox.right - 30) {
                //             console.log('Move tab to right ', TabBoxUpdated.left, fakeTabBox.right - 30);
                //             // fakeTab.className = fakeTabClassName.replace(/order(\d)/, match => {
                //             //     let order = parseInt(match.replace(/\D/g, ''));
                //             //     return 'order' + (order + 2);
                //             // });
                //             this.props.tabs.updateTab({ ...currentTab, order: currentTab.order + 2 });
                //         }

                //         if (TabBoxUpdated.right < fakeTabBox.left + 30) {
                //             console.log('Move tab to left ', TabBoxUpdated.right, fakeTabBox.left + 30);
                //             // fakeTab.className = fakeTabClassName.replace(/order(\d)/, match => {
                //             //     let order = parseInt(match.replace(/\D/g, ''));
                //             //     return 'order' + (order - 2);
                //             // });
                //             this.props.tabs.updateTab({ ...currentTab, order: currentTab.order - 2 });
                //         }

                //         tabEl.style.left = `${left}px`;
                //         shift = 0;
                //     };
                //     const onMouseUp = (e: MouseEvent) => {
                //         tabEl.style.position = 'relative';
                //         tabEl.style.left = `0px`;
                //         tabEl.style.zIndex = '0';

                //         this.props.tabs.updateTab({ id: currentTab.id, moves: false });

                //         document.removeEventListener('mousemove', onMouseMove);
                //         document.removeEventListener('mouseup', onMouseUp);
                //     };

                //     document.addEventListener('mousemove', onMouseMove)
                //     document.addEventListener('mouseup', onMouseUp);
                // }

            } break;
            // Handle middle click, close tab
            case 1: {
                this.close(e, tab.id);
            } break;
            // Handle right click, invoke the popup menu
            case 2: {
                this.popup(e, tab.id);
            } break;
        }
    }

    private focus = (event: React.MouseEvent<any> & Event, id: number) => {
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
        const tab = this.props.tabs.getTab(id);

        if (isComponentUrl(tab.url)) {
            E.ipcRenderer.send(Const.CLEARVIEW);
        } else {
            E.ipcRenderer.send(Const.FOCUSTAB, id);
        }

        this.props.tabs!.setFocus(id);
    }

    private popup = (event: React.MouseEvent<any> & Event, id: number) => {
        const context: E.MenuItemConstructorOptions[] = [
            {
                id: 'copyAppUrl',
                label: 'Copy App Url',
                click: () => {
                    const tab: Tab | undefined = this.props.tabs.getTab(id);

                    tab && E.clipboard.writeText(encodeURI(`figma://file/${tab.fileKey}/${tab.title}`));
                }
            },
            {
                id: 'copyUrl',
                label: 'Copy Url',
                click: () => {
                    const tab: Tab | undefined = this.props.tabs.getTab(id);

                    tab && E.clipboard.writeText(`${Const.HOMEPAGE}/file/${tab.fileKey}`);
                }
            },
            { type: 'separator' },
            {
                id: 'openInBrowser',
                label: 'Open in Browser',
                click: () => {
                    const tab: Tab | undefined = this.props.tabs.getTab(id);

                    tab && E.remote.shell.openExternal(`${Const.HOMEPAGE}/file/${tab.fileKey}`);
                }
            },
            { type: 'separator' },
            {
                id: 'close',
                label: 'Close',
                visible: true,
                click: () => {
                    console.log('close tab id: ', id);
                    this.close(event, id);
                }
            }
        ];

        const menu = E.remote.Menu.buildFromTemplate(context);

        menu.popup({
            window: E.remote.getCurrentWindow()
        });
    }

    render() {
        return (
            <TabList
                tabs={toJS(this.props.tabs) as ITabsStore}
                close={this.close}
                clickTab={this.clickTab}
            />
        )
    }
}

export default Tabs;