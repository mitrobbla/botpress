import { Dropdown, MoreOptions, MoreOptionsItems, style as sharedStyle } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer, useState } from 'react'
import { connect } from 'react-redux'
import {
  closeFlowNodeProps,
  copyFlowNode,
  fetchContentCategories,
  pasteFlowNode,
  refreshFlowsLinks,
  requestEditSkill,
  updateFlow
} from '~/actions'
import ContentForm from '~/components/ContentForm'
import { toastInfo } from '~/components/Shared/Utils'
import withLanguage from '~/components/Util/withLanguage'
import { getCurrentFlow, getCurrentFlowNode } from '~/reducers'
import EditableInput from '~/views/FlowBuilder/common/EditableInput'

import style from './style.scss'

const { MoreOptionsStyles } = sharedStyle

interface OwnProps {
  onDeleteSelectedElements: () => void
  readOnly: boolean
  subflows: any
  formData: any
  updateNode: any
  contentLang: string
  defaultLanguage: string
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

export interface FormState {
  contentType: string
  error: any
}

const shownCategories = ['builtin_text', 'builtin_image', 'builtin_carousel', 'builtin_card']
const defaultFormState: FormState = {
  contentType: 'builtin_text',
  error: null
}

const SaySomethingForm: FC<Props> = props => {
  const formReducer = (state: FormState, action): FormState => {
    if (action.type === 'resetData') {
      return {
        ...state,
        error: null,
        contentType: 'builtin_text'
      }
    } else if (action.type === 'newData') {
      const { contentType } = action.data

      return {
        error: null,
        contentType: contentType || 'builtin_text'
      }
    } else if (action.type === 'updateContentType') {
      const { value, initial } = action.data
      const contentType = { contentType: value || 'builtin_text' }

      if (!initial || !state.contentType) {
        props.updateNode(contentType)
      }

      return {
        ...state,
        ...contentType
      }
    } else {
      throw new Error(`That action type isn't supported.`)
    }
  }

  const [formState, dispatchForm] = useReducer(formReducer, defaultFormState)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    handleContentTypeChange(currentFlowNode?.contentType, true)
    if (!props.categories?.length) {
      props.fetchContentCategories()
    }
  }, [props.currentFlowNode.id])

  const renameNode = text => {
    if (text) {
      const alreadyExists = props.currentFlow.nodes.find(x => x.name === text)

      if (!alreadyExists) {
        props.updateNode({ name: text })
      }
    }
  }

  const transformText = text => {
    return text.replace(/[^a-z0-9-_\.]/gi, '_')
  }

  const onCopy = () => {
    props.copyFlowNode()
    setShowOptions(false)
    toastInfo('Copied to buffer')
  }

  const handleContentTypeChange = (value, initial = false) => {
    dispatchForm({ type: 'updateContentType', data: { value, initial } })
  }

  const { currentFlowNode, readOnly } = props
  const { contentType } = formState
  const categories = props.categories?.filter(cat => shownCategories.includes(cat.id))

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      icon: 'duplicate',
      label: 'Copy',
      action: onCopy.bind(this)
    },
    {
      icon: 'trash',
      label: 'Delete',
      action: props?.onDeleteSelectedElements,
      className: MoreOptionsStyles.delete
    }
  ]

  const goThroughObjectAndLeaveOutIndex = (properties, indexToRemove) => {
    const returnObject = {}

    Object.keys(properties).forEach(key => {
      if (key !== indexToRemove) {
        returnObject[key] =
          Object.prototype.toString.call(properties[key]) === '[object Object]'
            ? goThroughObjectAndLeaveOutIndex(properties[key], indexToRemove)
            : properties[key]
      }
    })

    return returnObject
  }

  const removeDescriptions = json => {
    const { properties, ...leftover } = json

    const newProperties = goThroughObjectAndLeaveOutIndex(properties, 'description')

    return { properties: newProperties, ...leftover }
  }

  const getCurrentCategory = () => {
    if (!contentType || !categories) {
      return
    }

    const {
      schema: {
        json: { description, title, ...json },
        ...schema
      },
      ...category
    } = categories?.find(cat => cat.id === contentType)

    // just a way to remove the descriptions since we don't want it in the sidebar form, but still want it in the CMS
    return { ...category, schema: { json: removeDescriptions(json), ...schema } }
  }

  const currentCategory = getCurrentCategory()

  const handleEdit = event => {
    if (!_.isEqual(event.formData, props.formData)) {
      props.updateNode({
        formData: event.formData
      })
    }
  }

  return (
    <Fragment>
      <div className={style.formHeader}>
        <h4>Say Something</h4>
        <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
      </div>
      <label className={style.fieldWrapper}>
        <span className={style.formLabel}>Node Name</span>
        <EditableInput
          readOnly={readOnly}
          value={currentFlowNode.name}
          className={style.textInput}
          onChanged={renameNode}
          transform={transformText}
        />
      </label>
      <div className={style.fieldWrapper}>
        <span className={style.formLabel}>Content Type</span>
        {categories && (
          <Dropdown
            className={style.formSelect}
            items={categories.map(cat => ({ value: cat.id, label: cat.title }))}
            defaultItem={contentType}
            rightIcon="caret-down"
            onChange={option => {
              handleContentTypeChange(option.value)
            }}
          />
        )}
      </div>

      {currentCategory && (
        <ContentForm
          schema={currentCategory?.schema.json}
          uiSchema={currentCategory?.schema.ui}
          formData={currentFlowNode.formData}
          isEditing={true}
          onChange={handleEdit}
        />
      )}
    </Fragment>
  )
}

const mapStateToProps = state => ({
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state) as any,
  user: state.user,
  categories: state.content.categories
})

const mapDispatchToProps = {
  updateFlow,
  requestEditSkill,
  fetchContentCategories,
  closeFlowNodeProps,
  refreshFlowsLinks,
  copyFlowNode,
  pasteFlowNode
}

export default connect(mapStateToProps, mapDispatchToProps)(withLanguage(SaySomethingForm))
