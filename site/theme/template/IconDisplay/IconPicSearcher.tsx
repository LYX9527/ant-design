import React, { Component } from 'react';
import { Upload, Tooltip, Popover, Icon, Modal, Progress, message, Spin } from 'antd';
import CopyToClipboard from 'react-copy-to-clipboard';
import { injectIntl } from 'react-intl';

const { Dragger } = Upload;

interface PicSearcherProps {
  intl: any;
}

interface PicSearcherState {
  loading: Boolean;
  modalVisible: Boolean;
  icons: Array<string>;
  fileList: Array<any>;
}

interface iconObject {
  type: string;
  score: number;
}

class PicSearcher extends Component<PicSearcherProps, PicSearcherState> {
  state = {
    loading: false,
    modalVisible: false,
    icons: [],
    fileList: [],
  };

  componentDidMount() {
    document.addEventListener('paste', this.onPaste);
  }

  componentWillUnmount() {
    document.removeEventListener('paste', this.onPaste);
  }

  onPaste = (event: ClipboardEvent) => {
    const items = event.clipboardData && event.clipboardData.items;
    let file = null;
    if (items && items.length) {
      for (let i = 0; i < items.length; i += 1) {
        if (items[i].type.indexOf('image') !== -1) {
          file = items[i].getAsFile();
          break;
        }
      }
    }
    if (file) this.uploadFile(file);
  };

  uploadFile = (file: File) => {
    const reader: FileReader = new FileReader();
    reader.onload = () => {
      this.predict(reader.result);
      this.setState(() => ({
        fileList: [{ uid: 1, name: file.name, status: 'done', url: reader.result }],
      }));
    };
    reader.readAsDataURL(file);
  };

  predict = async (imageBase64: any) => {
    const {
      intl: { messages },
    } = this.props;
    this.setState(() => ({ loading: true }));
    try {
      const res = await fetch(
        '//1647796581073291.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/cr-sh.cr-fc-predict__stable/cr-fc-predict/',
        {
          method: 'post',
          body: JSON.stringify({
            modelId: 'data_icon',
            type: 'ic',
            imageBase64,
          }),
        },
      );
      let icons = await res.json();
      icons = icons.map((i: any) => ({ score: i.score, type: i.class_name.replace(/\s/g, '-') }));
      this.setState(() => ({ icons, loading: false }));
    } catch (err) {
      message.error(messages['app.docs.components.icon.pic-searcher.server-error']);
      this.setState(() => ({ loading: false }));
    }
  };

  toggleModal = () => {
    this.setState(prev => ({
      modalVisible: !prev.modalVisible,
      fileList: [],
      icons: [],
    }));
  };

  onCopied = (text: string) => {
    message.success(
      <span>
        <code className="copied-code">{text}</code> copied 🎉
      </span>,
    );
  };

  render() {
    const {
      intl: { messages },
    } = this.props;
    const { modalVisible, icons, fileList, loading } = this.state;
    return (
      <div className="icon-pic-searcher">
        <Popover content={messages[`app.docs.components.icon.pic-searcher.intro`]} visible>
          <Icon type="camera" className="icon-pic-btn" onClick={this.toggleModal} />
        </Popover>
        <Modal
          title={messages[`app.docs.components.icon.pic-searcher.title`]}
          visible={modalVisible}
          onOk={this.toggleModal}
          onCancel={this.toggleModal}
        >
          <Dragger
            accept="image/jpeg, image/png"
            listType="picture"
            customRequest={(o: any) => this.uploadFile(o.file)}
            fileList={fileList}
            showUploadList={{ showPreviewIcon: false, showRemoveIcon: false }}
          >
            <p className="ant-upload-drag-icon">
              <Icon type="inbox" />
            </p>
            <p className="ant-upload-text">
              {messages['app.docs.components.icon.pic-searcher.placeholder']}
            </p>
          </Dragger>
          <Spin spinning={loading}>
            <div className="icon-pic-search-result">
              {icons.map((icon: iconObject) => (
                <div key={icon.type}>
                  <CopyToClipboard text={`<Icon type="${icon.type}" />`} onCopy={this.onCopied}>
                    <Tooltip title={icon.type} placement="right">
                      <Icon type={icon.type} />
                    </Tooltip>
                  </CopyToClipboard>
                  <Progress percent={Math.ceil(icon.score * 100)} />
                </div>
              ))}
            </div>
          </Spin>
        </Modal>
      </div>
    );
  }
}

export default injectIntl(PicSearcher);
