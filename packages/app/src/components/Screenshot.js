// @flow
import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import KeyGrapper from './KeyGrapper'
import { EditIcon, CheckmarkIcon, CloseIcon, Icon, PlusIcon, TrashIcon } from './Icons'
import Form, { FormError, Selectable, Selectables, TextArea } from './Form'
import Button from './Button'
import * as gt from '../../graphql'
import { Query, type QueryRenderProps, Mutation, type MutationFunction } from 'react-apollo'
import GET_APPLICATION from '../../graphql/GetApplication.graphql'
import ADD_ANNOTATION from '../../graphql/AddAnnotation.graphql'
import UPDATE_ANNOTATION from '../../graphql/UpdateAnnotation.graphql'
import DELETE_ANNOTATION from '../../graphql/DeleteAnnotation.graphql'
import { Fragment } from 'react'
import { ModalActions } from './Modal'
import Modal from './Modal'
import ReactMarkdown from 'react-markdown'
import { Helmet } from 'react-helmet'

// TODO fix loading and error handling

type Can = {|
  width: number,
  offsetLeft: number
|}

const fadeInKf = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 100%;
  }
`

const annotateColors = {
  DESIGN: {
    foreground: '#f00',
    background: 'rgba(255, 0, 0, 0.3)',
    activeBackground: 'rgba(255, 0, 0, 0.5)'
  },
  FUNCTIONALITY: {
    foreground: '#ffb648',
    background: 'rgba(255, 182, 72, 0.3)',
    activeBackground: 'rgba(255, 182, 72, 0.5)'
  },
  USABILITY: {
    foreground: '#f0f',
    background: 'rgba(255, 0, 255, 0.3)',
    activeBackground: 'rgba(255, 0, 255, 0.5)'
  },
  LANGUAGE: {
    foreground: '#0ff',
    background: 'rgba(0, 255, 255, 0.3)',
    activeBackground: 'rgba(0, 255, 255, 0.5)'
  }
}

const Drag = styled.div`
  position: absolute;
  height: 1em;
  width: 1em;
  user-select: none;
  z-index: 200;

`

const DragUL = styled(Drag)`
  top: 0;
  left: 0;
`
const DragLR = styled(Drag)`
  bottom: 0;
  right: 0;
`
const InvisibleDrag = styled(Drag)`
  background-color: transparent;
  z-index: 201;
  cursor: move;
`

const InvisibleDragUL = styled(InvisibleDrag)`
  top: 0;
  left: 0;
`

const InvisibleDragLR = styled(InvisibleDrag)`
  bottom: 0;
  right: 0;
`

const AnnotateActionIcons = styled.div`
  display: flex;
  justify-content: space-between;

`
const Action = styled.div`
  flex-grow: 0;
  flex-shrink: 0;
  height: 1em;
  width: 1em;
  border-radius: 1em;
  background-color: ${({red}) => red ? '#c63a3a' : '#0fab0a'};
  padding: 0.5em;
  ${Icon} {
    fill: #fff;
    width: 1em;
    height: 1em;
    cursor: pointer;
  }
`

const AnnotateBox = styled.div.attrs({
  style: ({x, y, width, height, scale, offsetLeft, manual}) => {
    if (manual) {
      return {}
    }
    return ({
      top: y * scale,
      left: x * scale + offsetLeft,
      width: width * scale,
      height: height * scale
    })
  }
})`
  position: absolute;
  user-select: none;
  border: 0.05em solid ${({type}) => annotateColors[type].foreground};
  background-color: ${({type, active}) => active ? annotateColors[type].activeBackground : annotateColors[type].background};
  transition: 0.1s background;
  cursor: pointer;
  box-sizing: border-box;
  z-index: ${({active}) => active ? 11 : 10};
  animation: ${fadeInKf} 0.1s ease-in;
  ${Drag} {
    background-color: ${({type}) => annotateColors[type].foreground};
  }

  ${AnnotateActionIcons} {
    position: absolute;
    top: calc(100% + 1em);
    left: 50%;
    width: 5em;
    margin-left: -2.5em;
  }
  ${Icon} {
    cursor: pointer;
    user-select: none;
  }

`

type Pos = {| x: number, y: number |}

type Rect = {| ...Pos, width: number, height: number |}

class Dragger extends React.Component<{| scale: number, children: React.Element<typeof InvisibleDrag>, onDrag: (Pos) => any |}> {
  _x: number
  _y: number
  _ref: HTMLDivElement

  _dragStart = (e: DragEvent) => {
    this._x = e.clientX
    this._y = e.clientY
  }

  _drag = (e: DragEvent) => {
    this.props.onDrag({
      x: (e.clientX - this._x) * this.props.scale,
      y: (e.clientY - this._y) * this.props.scale
    })
    this._x = e.clientX
    this._y = e.clientY
  }
  _drop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  _reffer = ref => {
    this._ref = ref
  }

  componentDidMount () {
    this._ref.addEventListener('dragstart', this._dragStart, false)
    this._ref.addEventListener('drop', this._drop, false)
    this._ref.addEventListener('drag', this._drag, false)
  }

  render () {
    const child = React.Children.only(this.props.children)
    return (
      <child.type
        {...child.props}
        innerRef={this._reffer}
        draggable
      />
    )
  }
}

class DraggerContainer extends React.Component<{|
  scale: number, offsetLeft: number,
  type: gt.AnnotationType,
  x: number, y: number, width: number, height: number,
  onClose?: () => any, onSave?: (Rect) => any
|}> {

  _ref: HTMLDivElement

  _x = this.props.x
  _y = this.props.y
  _width = this.props.width
  _height = this.props.height

  componentDidMount () {
    this._updatePos()
    if (!this._ref) return
    this._ref.addEventListener('dragover', this._dragOver, false)
  }

  _updatePos () {
    this._ref.style.top = `${this._y * this.props.scale}px`
    this._ref.style.left = `${this._x * this.props.scale + this.props.offsetLeft}px`
    this._ref.style.width = `${this._width * this.props.scale}px`
    this._ref.style.height = `${this._height * this.props.scale}px`
  }

  componentDidUpdate () {
    this._updatePos()
  }

  _draggerLr = p => {
    const newWidth = this._width + p.x
    if (newWidth < 0) {
      this._width = 0
      this._x += newWidth
    } else {
      this._width = newWidth
    }
    const newHeight = this._height + p.y
    if (newHeight < 0) {
      this._height = 0
      this._y += newHeight
    } else {
      this._height = newHeight
    }
    this._updatePos()
  }
  _draggerUl = p => {
    this._x += p.x
    this._width = Math.max(0, this._width - p.x)
    this._y += p.y
    this._height = Math.max(0, this._height - p.y)
    this._updatePos()
  }

  _dragOver = (e: DragEvent) => {
    e.preventDefault()
  }
  _save = e => {
    this.props.onSave && this.props.onSave({
      x: this._x,
      y: this._y,
      width: this._width,
      height: this._height
    })
  }

  _close = e => {
    e.stopPropagation()
    this.props.onClose && this.props.onClose()
  }

  render () {
    return (
      <AnnotateBox
        active
        type={this.props.type}
        manual
        innerRef={r => {
          this._ref = r
        }}>
        <DragLR />
        <DragUL />
        <Dragger onDrag={this._draggerLr} scale={1 / this.props.scale}>
          <InvisibleDragLR />
        </Dragger>
        <Dragger onDrag={this._draggerUl} scale={1 / this.props.scale}>
          <InvisibleDragUL />
        </Dragger>
        <AnnotateActionIcons>
          <Action onClick={this._save}>
            <CheckmarkIcon />
          </Action>
          <Action red onClick={this._close}>
            <CloseIcon />
          </Action>
        </AnnotateActionIcons>
      </AnnotateBox>
    )
  }
}

type AProps = {|
  open?: boolean,
  editing?: boolean,
  canvas: Can,
  screenshot: gt.GetProject_project_applications_screenshot,
  annotation: gt.GetApplication_application_annotations,
  onStopEdit?: () => any,
  onDelete?: () => any,
  onClick?: () => any,
  onEdit?: () => any,
  isAdmin: bool,
  onSave?: (rect: Rect) => any
|}

class A extends React.Component<AProps> {

  render () {
    const scale = this.props.canvas.width / this.props.screenshot.width
    const offsetLeft = this.props.canvas.offsetLeft
    const x = this.props.annotation.x
    const y = this.props.annotation.y
    const width = this.props.annotation.width
    const height = this.props.annotation.height
    return (
      this.props.open && this.props.editing
        ? (
          <DraggerContainer
            {...{x, y, width, height, offsetLeft, scale}}
            type={this.props.annotation.type}
            onClose={this.props.onStopEdit}
            onSave={this.props.onSave}
          />
        ) : (
          <AnnotateBox
            type={this.props.annotation.type}
            {...{x, offsetLeft, y, width, height, scale}}
            onClick={this.props.onClick}
            active={this.props.open}>
            {(this.props.open && this.props.isAdmin) &&
            (<AnnotateActionIcons>
              <Action onClick={e => {
                e.stopPropagation()
                this.props.onEdit && this.props.onEdit()
              }}>
                <EditIcon />
              </Action>
              <Action onClick={e => {
                e.stopPropagation()
                this.props.onDelete && this.props.onDelete()
              }} red>
                <TrashIcon />
              </Action>
            </AnnotateActionIcons>)}
          </AnnotateBox>
        ))
  }
}

const ClickCatcher = styled.div`
  z-index: ${({closer}) => closer ? 1 : 15};
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: ${({closer}) => closer ? 'initial' : 'crosshair'};
`

const ImageContainer = styled.div`
  position: relative;
  img {
    max-width: 100%;
    margin: auto;
    display: block;
  }
`

const Adder = styled.div`
  user-select: none;
  position: fixed;
  bottom: 2em;
  z-index: 20;
  right: 2em;
  height: 1.5em;
  width: 1.5em;
  background-color: #25e2cc;  
  box-shadow: 0 0 1em #808080;
  border-radius: 2.75em;
  padding: 1em;
  transition: 0.1s background;
  cursor: pointer;
  :hover {
    background-color: #25ffe9;
  }
  ${Icon} {
    fill: #ffffff;
  }
`

function prettyRect (rect: Rect): Rect {
  return {
    x: Math.floor(rect.x),
    y: Math.floor(rect.y),
    width: Math.floor(rect.width),
    height: Math.floor(rect.height)

  }
}

type CreatorAProps = {|
  app: gt.GetProject_project_applications,
  x: number,
  y: number,
  width: number,
  height: number,
  canvas: Can,
  isAdmin: bool,
  onCreate?: string => any,
  onCancel?: () => any,
  project: string
|}
type CreatorAState = {|
  annotation: gt.GetApplication_application_annotations,
|}

class CreatorA extends React.Component<CreatorAProps, CreatorAState> {
  state = {
    annotation:
      {
        id: '',
        description: '',
        type: 'DESIGN',
        height: this.props.height,
        width: this.props.width,
        x: this.props.x,
        y: this.props.y
      }
  }
  rf: { query: *, variables: * }[] = [{
    query: GET_APPLICATION,
    variables: {id: this.props.app.id, project: this.props.project}
  }]

  render () {
    return (
      <Mutation
        mutation={ADD_ANNOTATION}
        refetchQueries={this.rf}>
        {(f: MutationFunction<gt.AddAnnotation, gt.AddAnnotationVariables>) => {
          return (
            <A
              isAdmin={this.props.isAdmin}
              open
              onStopEdit={() => this.props.onCancel && this.props.onCancel()}
              onSave={async (rect) => {
                const res = await f({variables: {app: this.props.app.id, ...this.state.annotation, ...prettyRect(rect)}})
                if (res && res.data && this.props.onCreate) {
                  this.props.onCreate(res.data.createAnnotation.id)
                }
              }}
              editing
              canvas={this.props.canvas}
              annotation={this.state.annotation}
              screenshot={this.props.app.screenshot}
            />
          )
        }}
      </Mutation>)
  }
}

type EditableAProps = {|
  app: gt.GetProject_project_applications,
  canvas: Can,
  open?: boolean,
  onOpen?: () => any,
  isAdmin: bool,
  onClose?: () => any,
  onDelete?: () => any,
  project: string,
  annotation: gt.GetApplication_application_annotations
|}
type EditableAState = {|
  editing: boolean
|}

class EditableA extends React.Component<EditableAProps, EditableAState> {
  state = {editing: false}

  componentDidUpdate (props) {
    if (!this.props.open && props.open) {
      this.setState({editing: false})
    }
  }

  rf: { query: *, variables: * }[] = [{
    query: GET_APPLICATION,
    variables: {id: this.props.app.id, project: this.props.project}
  }]

  render () {
    return (
      <Mutation mutation={UPDATE_ANNOTATION} refetchQueries={this.rf}>
        {(f: MutationFunction<gt.UpdateAnnotation, gt.UpdateAnnotationVariables>) => {
          return (
            <A
              isAdmin={this.props.isAdmin}
              screenshot={this.props.app.screenshot}
              canvas={this.props.canvas}
              editing={this.state.editing}
              onDelete={this.props.onDelete}
              onEdit={() => this.setState({editing: true})}
              onSave={async rect => {
                await f({variables: {...prettyRect(rect), annotation: this.props.annotation.id}})
                this.setState({editing: false})
              }}
              open={this.props.open}
              onStopEdit={() => this.setState({editing: false})}
              onClick={() => {
                if (this.props.open) {
                  this.props.onClose && this.props.onClose()
                } else {
                  this.props.onOpen && this.props.onOpen()
                }
              }}
              annotation={this.props.annotation} />
          )
        }}
      </Mutation>
    )
  }
}

const DeleteAnnotation = ({id, app, onClose, project}) => (
  <Mutation
    mutation={DELETE_ANNOTATION}
    refetchQueries={(): { query: *, variables: * }[] => ([{query: GET_APPLICATION, variables: {id: app, project}}])}>
    {(mutate: MutationFunction<gt.DeleteAnnotation, gt.DeleteAnnotationVariables>, {error}) => {
      return (
        <Fragment>
          <h1>Delete annotation</h1>
          {error && <FormError>{error}</FormError>}
          <p>
            Are you sure that you want to delete the annotation? When deleted the
            it can not be restored.
          </p>
          <ModalActions>
            <Button positive onClick={async () => {
              await mutate({variables: {id}})
              onClose()
            }}>
              Yes
            </Button>
            <Button negative onClick={onClose}>
              No
            </Button>
          </ModalActions>
        </Fragment>)
    }}
  </Mutation>
)

const C1 = styled.div`
  display: flex;
  height: 100%;
  align-items: stretch;
`

const C11 = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
  position: relative;
`

const C12 = styled.div`
  flex-grow: 0;
  flex-shrink: 0;
  position: relative;
  flex-basis: 20em;
  width: 20em;
`

type EditableDescriptionProps = {|
  open: boolean,
  app: string,
  project: string,
  isAdmin: bool,
  onDelete?: () => any,
  annotation: gt.GetApplication_application_annotations,
  canvas: Can,
  screenshot: gt.GetProject_project_applications_screenshot
|}

const DescriptionContainer = styled.div`
  position: absolute;
  top: ${({y}) => y}px;
  width: 100%;
  z-index: 20;
  ${AnnotateActionIcons} {
    position: absolute;
    top: calc(100% + 1em);
    left: 50%;
    width: 5em;
    margin-left: -2.5em;
  }

`

const DescRM = styled.div`

`
const DescBox = styled.div`
  background-color: #fff;
  box-shadow: 0 0 0.5em #aaa;
  padding: 1em;
  > ${DescRM} {
    font-family: Roboto, sans-serif;
    font-size: 0.8em;
  }
  > ${Form} {
    font-size: 0.8em;
  }
  ${TextArea} {
    min-height: 10em;
    font-family: Roboto, sans-serif;
  }
`

const TypeDot = styled.div`
  background-color: ${({type}) => annotateColors[type].foreground};
  height: 1em;
  width: 1em;
  border-radius: 0.5em;
  float: right;
`

const EditableLabel = styled(({type, ...props}) => (
  <div {...props}>
    <TypeDot type={type} /> {type}
  </div>
))`
    font-family: "Roboto Condensed", sans-serif;
    font-size: 0.9em;
    color: #7d7d7d;
`

class EditableDescription extends React.Component<EditableDescriptionProps, { editing: boolean, description: string, type: gt.AnnotationType }> {
  state = {editing: false, description: '', type: 'DESIGN'}

  y () {
    const scale = this.props.canvas.width / this.props.screenshot.width
    return scale * this.props.annotation.y
  }

  _submit = async (f: *) => {
    await f({
      variables: {
        annotation: this.props.annotation.id,
        description: this.state.description,
        type: this.state.type
      }
    })
    this.setState({editing: false})
  }

  _renderContent (f) {
    if (this.state.editing) {
      return (
        <React.Fragment>
          <DescBox>
            <EditableLabel type={this.state.type} />
            <DescRM>
              <ReactMarkdown source={this.state.description} />
            </DescRM>
            <Form onSubmit={async (e) => {
              e.preventDefault()
              this._submit(f)
            }}>
              <TextArea value={this.state.description} onChange={e => this.setState({description: e.target.value})} />
              <Selectables>
                <Selectable
                  selected={this.state.type === 'USABILITY'}
                  onClick={() => this.setState({type: 'USABILITY'})}>
                  <input type={'radio'} checked={this.state.type === 'USABILITY'} />
                  Usability
                </Selectable>
                <Selectable selected={this.state.type === 'DESIGN'} onClick={() => this.setState({type: 'DESIGN'})}>
                  <input type={'radio'} checked={this.state.type === 'DESIGN'} />
                  Design
                </Selectable>
                <Selectable selected={this.state.type === 'FUNCTIONALITY'}
                            onClick={() => this.setState({type: 'FUNCTIONALITY'})}>
                  <input type={'radio'} checked={this.state.type === 'FUNCTIONALITY'} />
                  Functionality
                </Selectable>
                <Selectable selected={this.state.type === 'LANGUAGE'} onClick={() => this.setState({type: 'LANGUAGE'})}>
                  <input type={'radio'} checked={this.state.type === 'LANGUAGE'} />
                  Language
                </Selectable>
              </Selectables>
            </Form>
          </DescBox>
          <AnnotateActionIcons>
            <Action onClick={() => this._submit(f)}>
              <CheckmarkIcon />
            </Action>
            <Action red onClick={() => this.setState({editing: false})}>
              <CloseIcon />
            </Action>
          </AnnotateActionIcons>
        </React.Fragment>
      )
    }
    return (
      <React.Fragment>
        <DescBox>
          <EditableLabel type={this.props.annotation.type} />
          <DescRM>
            <ReactMarkdown source={this.props.annotation.description} />
          </DescRM>
        </DescBox>
        {this.props.isAdmin && (
          <AnnotateActionIcons>
            <Action onClick={() => this.setState({
              editing: true,
              description: this.props.annotation.description,
              type: this.props.annotation.type
            })}>
              <EditIcon />
            </Action>
            <Action red onClick={this.props.onDelete}>
              <TrashIcon />
            </Action>
          </AnnotateActionIcons>
        )}
      </React.Fragment>
    )
  }

  rf: { query: *, variables: * }[] = [{
    query: GET_APPLICATION,
    variables: {id: this.props.app, project: this.props.project}
  }]

  render () {
    if (!this.props.open) {
      return null
    }
    return (
      <Mutation mutation={UPDATE_ANNOTATION} refetchQueries={this.rf}>
        {(f: MutationFunction<gt.UpdateAnnotation, gt.UpdateAnnotationVariables>) => {
          return (
            <DescriptionContainer y={this.y()}>
              {this._renderContent(f)}
            </DescriptionContainer>)
        }}
      </Mutation>
    )
  }
}

type AnnotatorState = {|
  canvas: ?Can,
  open: ?string,
  adding: boolean | Rect,
  modal: ?gt.GetApplication_application_annotations
|}

type AnnotatorProps = {|
  app: gt.GetProject_project_applications,
  annotations: gt.GetApplication_application_annotations[],
  project: string,
  isAdmin: bool
|}

class Annotator extends React.Component<AnnotatorProps, AnnotatorState> {
  state = {canvas: null, open: null, adding: false, modal: null}
  _ref: ?HTMLImageElement
  _onLoad = (evt) => {
    this._load(evt.target)
  }

  _onResize = () => {
    if (!this._ref) {
      return
    }
    this._load(this._ref)
  }

  _load (element: HTMLImageElement) {
    const width = element.clientWidth
    const offsetLeft = element.offsetLeft
    this.setState({canvas: {width, offsetLeft}})
  }

  _add = e => {
    const canvas = this.state.canvas
    if (!canvas) return
    const scale = this.props.app.screenshot.width / canvas.width
    const x = e.nativeEvent.offsetX * scale
    const y = e.nativeEvent.offsetY * scale
    const width = this.props.app.screenshot.width / 10
    const height = width
    this.setState({adding: {x, y, width, height}, open: null})
  }

  componentDidMount () {
    window.addEventListener('resize', this._onResize)
    if (!this._ref) {
      return
    }
    if (this._ref.complete) {
      this._load(this._ref)
    }
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this._onResize)
  }

  _renderAnnotations (canvas: Can) {
    return this.props
      .annotations
      .map((annotation) => (
          <EditableA
            isAdmin={this.props.isAdmin}
            project={this.props.project}
            annotation={annotation}
            onDelete={() => this.setState({modal: annotation})}
            canvas={canvas}
            app={this.props.app}
            open={!this.state.adding && this.state.open === annotation.id}
            onClose={this._close}
            onOpen={() => this.setState({open: annotation.id})}
            key={annotation.id} />
        )
      )
  }

  _renderAnnotationLabels (canvas: Can) {
    return this.props
      .annotations
      .map((annotation) => (
          <EditableDescription
            isAdmin={this.props.isAdmin}
            project={this.props.project}
            app={this.props.app.id}
            onDelete={() => this.setState({modal: annotation})}
            open={this.state.open === annotation.id}
            canvas={canvas}
            screenshot={this.props.app.screenshot}
            annotation={annotation}
            key={annotation.id} />
        )
      )
  }

  _close = () => this.setState({open: null})

  _renderAdderRect (can: Can) {
    if (typeof this.state.adding === 'boolean') return null
    return (
      <CreatorA
        isAdmin={this.props.isAdmin}
        project={this.props.project}
        onCancel={() => this.setState({adding: false})}
        onCreate={open => this.setState({open, adding: false})}
        app={this.props.app}
        {...this.state.adding}
        canvas={can} />
    )
  }

  render () {
    return (
      <React.Fragment>
        <Helmet title={this.props.app.name} />
        <ClickCatcher closer onClick={this._close} />
        <C1>
          <C11>
            <ImageContainer adding={this.state.adding}>
              {this.state.canvas && this._renderAnnotations(this.state.canvas)}
              {this.state.canvas && this._renderAdderRect(this.state.canvas)}
              {this.state.adding === true && <ClickCatcher onClick={this._add} />}
              <img
                onClick={this._close}
                ref={(r) => {this._ref = r}}
                onLoad={this._onLoad}
                src={this.props.app.screenshot.url}
              />
              <KeyGrapper code={'Escape'} on={this._close} />
            </ImageContainer>
            {
              this.props.isAdmin &&
              (
                <Adder onClick={() => this.setState(({adding}) => adding ? {adding: false, open: null} : {
                  adding: true,
                  open: null
                })}>
                  {!this.state.adding ? <PlusIcon /> : <CloseIcon />}
                </Adder>
              )}
          </C11>
          <C12>
            {this.state.canvas && this._renderAnnotationLabels(this.state.canvas)}
          </C12>
        </C1>

        {this.state.modal && (
          <Modal>
            <DeleteAnnotation
              id={this.state.modal.id} app={this.props.app.id} project={this.props.project}
              onClose={() => this.setState({modal: null})} />
          </Modal>
        )}
      </React.Fragment>
    )
  }
}

export default ({app, project, isAdmin}: {| app: gt.GetProject_project_applications, project: string, isAdmin: bool |}) => (
  <React.Fragment key={app.id}>
    <Query query={GET_APPLICATION} variables={{id: app.id, project: project}}>
      {({data, error, loading}: QueryRenderProps<gt.GetApplication, gt.GetApplicationVariables>) => {
        const annotations = error || loading || !data || !data.application ? [] : data.application.annotations
        return <Annotator isAdmin={isAdmin} app={app} annotations={annotations} project={project} />
      }}
    </Query>
  </React.Fragment>
)
