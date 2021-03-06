import React, { Component } from 'react'
import Link from 'next/link'
import Layout from '../components/Layout'
import CryptoJS from 'crypto-js'
import api from '../utils/api'
import ClipboardButton from 'react-clipboard.js'
import Storage from '../utils/storage'

export default class Index extends Component {
  constructor (props) {
    super(props)

    this.state = {
      text: '',
      pass: '',
      res: {},
      loading: false,
      copy: false
    }
  }

  onClear = () => {
    this.setState({ res: {} })
  }

  onInput = (evt) => {
    const { name, value } = evt.target
    this.setState({ [name]: value })
  }

  onSave = async () => {
    const { text, pass } = this.state

    this.setState({ loading: true })

    const cipher = CryptoJS.AES.encrypt(text, pass).toString()

    const res = await api.create(cipher)
    this.setState({ res: res, text: '', pass: '', loading: false }, () => {
      Storage.put(res.id)
    })
  }

  getText = () => `https://lock.sh/${this.state.res.id}`

  hoursRemain = (time) => ((time - Date.now()) / (1000 * 60 * 60)).toFixed(0)

  onCopy = () => {
    this.setState({ copy: true })
    setTimeout(() => this.setState({ copy: false}), 500)
  }

  render () {
    const { text, pass, res, loading, copy } = this.state

    let known_locks
    if (process.browser) {
      known_locks = Storage.list()
    }

    let copyStyle = {
      width: '60px',
      position: 'absolute',
      top: '4px',
      right: '5px'
    }

    if (copy) {
      copyStyle = Object.assign(copyStyle, {
        borderColor: '#3273dc',
        color: '#3273dc'
      })
    }

    return (
      <Layout>
        <main>
          { res.ok &&
            <div className='notification is-link'>
              <button className='delete' onClick={this.onClear}></button>

              <p><strong>Secure lock created</strong></p>

              <div className='control'>
                <input className='input' value={`https://lock.sh/${res.id}`} readOnly />

                <ClipboardButton className='button is-small' style={copyStyle} option-text={this.getText} onSuccess={this.onCopy}>
                  <span>{copy ? 'Copied' : 'Copy'}</span>
                </ClipboardButton>
              </div>
            </div>
          }

          { res.ok === false &&
            <div className='notification is-danger'>
              <button className='delete' onClick={this.onClear}></button>
              <span>Unable to save your lock</span>
            </div>
          }

          <div className='field'>
            <label className='label'>Data to Lock</label>

            <div className='control'>
              <textarea className='textarea' name='text' rows='10' value={text} onChange={this.onInput} />
            </div>
          </div>

          <div className='field'>
            <label className='label'>Encryption Password</label>
            <div className='control'>
              <input className='input' type='password' name='pass' value={pass} onChange={this.onInput} />
            </div>
          </div>

          <div className='field' style={{ display: 'flex' }}>
            <button className={`button is-link ${loading ? 'is-loading' : ''}`} style={{ flexGrow: '1' }} onClick={this.onSave} disabled={!text || !pass}>Encrypt & Save</button>
          </div>

          <div className='info'>
            Locks expire after 24 hours
          </div>

          { known_locks &&
            <div className='list'>
              <label className='label'>Known Locks</label>

              <ul>
                { Object.keys(known_locks).map(key => {
                  const time = known_locks[key]

                  return (
                    <li className='list-item'>
                      <span>
                        <a href={`https://lock.sh/${key}`}>{ key }</a>
                      </span>

                      <span className='time'>~{ this.hoursRemain(time) }h</span>
                    </li>
                  )
                }) }
              </ul>
            </div>
          }
        </main>

        <style jsx>{`
          .info {
            margin-top: 50px;
            text-align: center;
          }
          .list {
            margin-top: 50px;
          }
          .list-item {
            padding: 5px 70px;
            border-bottom: 1px solid #dbdbdb;
          }
          .list-item:last-child {
            border-bottom: none;
          }
          .time {
            float: right;
          }
        `}</style>
      </Layout>
    )
  }
}
