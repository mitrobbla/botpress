import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Glyphicon } from 'react-bootstrap'

import { addDocumentationHint, removeDocumentationHint, updateDocumentationModal } from '~/actions'

class StatusBarDocumentationProvider extends Component {
  componentDidMount() {
    this.props.addDocumentationHint(this.props.file)
  }

  componentWillUnmount() {
    this.props.removeDocumentationHint(this.props.file)
  }

  render() {
    // This is just a lifecycle utility component, it doesn't actually render anything
    return null
  }
}

const _LinkDocumentationProvider = props => {
  const passthroughProps = _.omit(props, 'children', 'onClick', 'href', 'updateDocumentationModal')
  const onClick = e => {
    e.preventDefault()

    if (window.DOCS && window.DOCS[props.file]) {
      window.open(`https://botpress.com/docs/${window.DOCS[props.file]}`, '_blank')
    }
  }
  return (
    <a {...passthroughProps} onClick={onClick}>
      {props.children || <Glyphicon glyph="question-sign" style={{ marginLeft: '3px', marginRight: '3px' }} />}
    </a>
  )
}

export default connect(
  null,
  { addDocumentationHint, removeDocumentationHint }
)(StatusBarDocumentationProvider)

export const LinkDocumentationProvider = connect(
  null,
  { updateDocumentationModal }
)(_LinkDocumentationProvider)
