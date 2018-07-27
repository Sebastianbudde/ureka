// @flow
import React, { Fragment } from 'react'
import styled, { injectGlobal } from 'styled-components'
import LeftNav from './LeftNav'
import TopNav from './TopNav'
import { Redirect, Route, Switch } from 'react-router'
import Projects from './Projects'
import Modal, { ModalActions } from './Modal'
import { FauxLabel, FileUpload, FormError, Label, Selectable, Selectables, Submit, TextField } from './Form'
import Form from './Form'
import Button from './Button'
import { Mutation, type MutationFunction, Query, type QueryRenderProps } from 'react-apollo'
import * as gt from '../../graphql'
import GET_PROJECTS from '../../graphql/GetProjects.graphql'
import GET_PROJECT from '../../graphql/GetProject.graphql'
import ADD_PROJECT from '../../graphql/AddProject.graphql'
import UPDATE_PROJECT from '../../graphql/UpdateProject.graphql'
import DELETE_PROJECT from '../../graphql/DeleteProject.graphql'
import UPDATE_REPORT from '../../graphql/UpdateReport.graphql'
import UPDATE_APPLICATION from '../../graphql/UpdateApplication.graphql'
import UPLOAD_APP from '../../graphql/UploadApp.graphql'
import DELETE_REPORT from '../../graphql/DeleteReport.graphql'
import UPLOAD_REPORT from '../../graphql/UploadReport.graphql'
import DELETE_APPLICATION from '../../graphql/DeleteApplication.graphql'
import type { DocumentNode } from 'graphql'
import Project from './Project'
import Report from './Report'
import { DesktopIcon, LogoIcon, MobileIcon } from './Icons'
import Screenshot from './Screenshot'
import { Helmet } from 'react-helmet'
import type { HtmlConfig } from './Html'
import KeyGrapper from './KeyGrapper'

// TODO fix loading and error handling

injectGlobal`
  body {
    background-color: #F5F5F5;
  }
`

const ContentView = styled.div`
  position:relative;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex-shrink: 1;
  align-items: stretch;  
  > ${TopNav} {
    flex-grow: 0;
    flex-shrink: 0;
  }
  > ${ContentView} {
    flex-grow: 1;
    flex-shrink: 1;
    overflow-y: auto;
  }
`

const Container = styled.div`
  display: flex;
  height: 100vh;

  > ${LeftNav} {
    width: 11em;
    flex-basis: 11em;
    flex-grow: 0;
    flex-shrink: 0;
  }
`

class AddProject extends React.Component<{ onSuccess?: (id: string) => any }, { value: string }> {
  state = {value: ''}

  render () {
    const refetch: { query: DocumentNode, variables?: {} }[] = [{query: GET_PROJECTS}]
    return (
      <Mutation mutation={ADD_PROJECT} refetchQueries={refetch}>
        {(addProject: MutationFunction<gt.AddProject, gt.AddProjectVariables>, {error}) => {
          return (
            <Fragment>
              <h1>Add project</h1>
              <p>
                Create a new project.
              </p>
              {error && <FormError>{error}</FormError>}
              <Form onSubmit={async (e) => {
                e.preventDefault()
                if (!this.state.value) {
                  return
                }
                const res: { data?: gt.AddProject } | void = await addProject({variables: {name: this.state.value}})
                this.setState({value: ''})
                if (res && res.data) {
                  this.props.onSuccess && this.props.onSuccess(res.data.createProject.id)
                }

              }}>
                <Label>
                  Project name
                  <TextField
                    placeholder={'Fancy project #1'}
                    value={this.state.value}
                    onChange={e => this.setState({value: e.target.value})} />
                </Label>
                <Submit value={'Create'} disabled={!this.state.value} />
              </Form>
            </Fragment>
          )
        }}
      </Mutation>
    )
  }
}

class EditApplication extends React.Component<{ id: string, type: gt.ApplicationType, name: string, project: string, onClose: () => any }, { value: string, type: gt.ApplicationType }> {
  state = {value: this.props.name, type: this.props.type}
  refetch: { query: DocumentNode, variables?: {} }[] = [{
    query: GET_PROJECT,
    variables: {id: this.props.project}
  }]

  render () {

    return (
      <Mutation mutation={UPDATE_APPLICATION} refetchQueries={this.refetch}>
        {(addProject: MutationFunction<gt.UpdateApplication, gt.UpdateApplicationVariables>, {error}) => {
          return (
            <Fragment>
              <h1>Edit application</h1>
              <p>
                Update the application information.
              </p>
              {error && <FormError>{error}</FormError>}
              <Form onSubmit={async (e) => {
                e.preventDefault()
                if (!this.state.value) {
                  return
                }
                const res: { data?: gt.UpdateApplication } | void = await addProject({
                  variables: {
                    id: this.props.id,
                    name: this.state.value,
                    type: this.state.type
                  }
                })
                this.setState({value: ''})
                if (res && res.data) {
                  this.props.onClose()
                }

              }}>
                <Label>
                  Application name
                  <TextField
                    value={this.state.value}
                    onChange={e => this.setState({value: e.target.value})} />
                </Label>
                <FauxLabel>
                  Type
                  <Selectables>
                    <Selectable
                      radio selected={this.state.type === 'DESKTOP'}
                      onClick={() => this.setState({type: 'DESKTOP'})}>
                      <DesktopIcon />
                      Desktop
                    </Selectable>
                    <Selectable
                      radio selected={this.state.type === 'MOBILE'}
                      onClick={() => this.setState({type: 'MOBILE'})}>
                      <MobileIcon />
                      Mobile
                    </Selectable>
                  </Selectables>
                </FauxLabel>
                <Submit value={'Change'} disabled={!this.state.value} />
              </Form>
            </Fragment>
          )
        }}
      </Mutation>
    )
  }
}

class EditReport extends React.Component<{ id: string, name: string, project: string, onClose: () => any }, { value: string }> {
  state = {value: this.props.name}

  render () {
    const refetch: { query: DocumentNode, variables?: {} }[] = [{
      query: GET_PROJECT,
      variables: {id: this.props.project}
    }]
    return (
      <Mutation mutation={UPDATE_REPORT} refetchQueries={refetch}>
        {(addProject: MutationFunction<gt.UpdateReport, gt.UpdateReportVariables>, {error}) => {
          return (
            <Fragment>
              <h1>Edit report</h1>
              <p>
                Update the report information.
              </p>
              {error && <FormError>{error}</FormError>}
              <Form onSubmit={async (e) => {
                e.preventDefault()
                if (!this.state.value) {
                  return
                }
                const res: { data?: gt.UpdateProject } | void = await addProject({
                  variables: {
                    id: this.props.id,
                    name: this.state.value
                  }
                })
                this.setState({value: ''})
                if (res && res.data) {
                  this.props.onClose()
                }

              }}>
                <Label>
                  Report name
                  <TextField
                    value={this.state.value}
                    onChange={e => this.setState({value: e.target.value})} />
                </Label>
                <Submit value={'Change'} disabled={!this.state.value} />
              </Form>
            </Fragment>
          )
        }}
      </Mutation>
    )
  }
}

class EditProject extends React.Component<{ id: string, name: string, onSuccess?: () => any }, { value: string }> {
  state = {value: this.props.name}

  render () {
    const refetch: { query: DocumentNode, variables?: {} }[] = [{query: GET_PROJECTS}]
    return (
      <Mutation mutation={UPDATE_PROJECT} refetchQueries={refetch}>
        {(addProject: MutationFunction<gt.UpdateProject, gt.UpdateProjectVariables>, {error}) => {
          return (
            <Fragment>
              <h1>Edit project</h1>
              <p>
                Update the base project information.
              </p>
              {error && <FormError>{error}</FormError>}
              <Form onSubmit={async (e) => {
                e.preventDefault()
                if (!this.state.value) {
                  return
                }
                const res: { data?: gt.UpdateProject } | void = await addProject({
                  variables: {
                    id: this.props.id,
                    name: this.state.value
                  }
                })
                this.setState({value: ''})
                if (res && res.data) {
                  this.props.onSuccess && this.props.onSuccess()
                }

              }}>
                <Label>
                  Project name
                  <TextField
                    placeholder={'Fancy project #1'}
                    value={this.state.value}
                    onChange={e => this.setState({value: e.target.value})} />
                </Label>
                <Submit value={'Change'} disabled={!this.state.value} />
              </Form>
            </Fragment>
          )
        }}
      </Mutation>
    )
  }
}

const ps: { query: *, variables: * }[] = [
  {query: GET_PROJECTS, variables: {}}
]

const DeleteProject = ({id, name, onClose}) => (
  <Mutation
    mutation={DELETE_PROJECT}
    refetchQueries={ps}>
    {(mutate: MutationFunction<gt.DeleteProject, gt.DeleteProjectVariables>, {error}) => {
      return (
        <Fragment>
          <h1>Delete project</h1>
          {error && <FormError>{error}</FormError>}
          <p>
            Are you sure that you want to delete project <i>{name}</i>? When deleted the project can not
            be restored.
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
        </Fragment>
      )
    }}
  </Mutation>
)

const DeleteApplication = ({id, name, onClose, project}) => (
  <Mutation
    mutation={DELETE_APPLICATION}
    refetchQueries={(): { query: *, variables: * }[] => ([{query: GET_PROJECT, variables: {id: project}}])}>
    {(mutate: MutationFunction<gt.DeleteApplication, gt.DeleteApplicationVariables>, {error}) => {
      return (
        <Fragment>
          <h1>Delete application</h1>
          {error && <FormError>{error}</FormError>}
          <p>
            Are you sure that you want to delete application <i>{name}</i>? When deleted the
            project can not
            be restored.
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

const DeleteReport = ({id, name, onClose, project}) => (
  <Mutation
    mutation={DELETE_REPORT}
    refetchQueries={(): { query: *, variables: * }[] => ([{query: GET_PROJECT, variables: {id: project}}])}>
    {(mutate: MutationFunction<gt.DeleteReport, gt.DeleteReportVariables>, {error}) => {
      return (
        <Fragment>
          <h1>Delete report</h1>
          {error && <FormError>{error}</FormError>}
          <p>
            Are you sure that you want to delete report <i>{name}</i>? When deleted the
            project can not
            be restored.
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

class UploadApp extends React.Component<{ onClose: () => any, project: string }, { value: string, type: 'DESKTOP' | 'MOBILE', hasFile: boolean }> {
  state = {value: '', type: 'DESKTOP', hasFile: false}
  _file: ?File
  refetch: { query: DocumentNode, variables?: {} }[] = [{
    query: GET_PROJECT,
    variables: {id: this.props.project}
  }]

  render () {
    return (
      <Mutation mutation={UPLOAD_APP} refetchQueries={this.refetch}>
        {(upload: MutationFunction<gt.UploadApp, gt.UploadAppVariables>, {error}) => {
          return (
            <Fragment>
              <h1>
                Upload application
              </h1>
              <p>
                Upload a new application!
              </p>
              {error && <FormError>{error}</FormError>}
              <Form onSubmit={async e => {
                e.preventDefault()
                if (!this._file || !this.state.value) return
                await upload({
                  variables: {
                    file: this._file,
                    name: this.state.value,
                    project: this.props.project,
                    type: this.state.type
                  }
                })
                this.props.onClose()
              }}>
                <Label>
                  Name
                  <TextField
                    placeholder={'Fancy application'} value={this.state.value}
                    onChange={e => this.setState({value: e.target.value})} />
                </Label>
                <FauxLabel>
                  Type
                  <Selectables>
                    <Selectable
                      radio selected={this.state.type === 'DESKTOP'}
                      onClick={() => this.setState({type: 'DESKTOP'})}>
                      <DesktopIcon />
                      Desktop
                    </Selectable>
                    <Selectable
                      radio selected={this.state.type === 'MOBILE'}
                      onClick={() => this.setState({type: 'MOBILE'})}>
                      <MobileIcon />
                      Mobile
                    </Selectable>
                  </Selectables>
                </FauxLabel>
                <FileUpload onChange={e => {
                  const file = e.target.files[0]
                  if (!file) return
                  this.setState(
                    ({value}) => ({value: value || file.name, hasFile: true}),
                    () => {
                      this._file = file
                    })
                }} />
                <Submit value={'Upload'} disabled={!this.state.value || !this.state.hasFile} />
              </Form>
            </Fragment>
          )
        }}
      </Mutation>
    )
  }
}

class UploadReport extends React.Component<{ project: string, onClose: () => any }, { value: string, hasFile: boolean }> {
  state = {value: '', hasFile: false}
  _file: ?File

  render () {
    const refetch: { query: DocumentNode, variables?: {} }[] = [{
      query: GET_PROJECT,
      variables: {id: this.props.project}
    }]
    return (
      <Mutation mutation={UPLOAD_REPORT} refetchQueries={refetch}>
        {(upload: MutationFunction<gt.UploadReport, gt.UploadReportVariables>, {error}) => {
          return (
            <Fragment>
              <h1>
                Upload report
              </h1>
              <p>
                Upload a new report!
              </p>
              {error && <FormError>{error}</FormError>}
              <Form onSubmit={async e => {
                e.preventDefault()
                await upload({variables: {file: this._file, name: this.state.value, project: this.props.project}})
                this.props.onClose()
              }}>
                <Label>
                  Name
                  <TextField
                    placeholder={'Fancy report'}
                    value={this.state.value}
                    onChange={e => this.setState({value: e.target.value})} />
                </Label>
                <FileUpload onChange={e => {
                  const file = e.target.files[0]
                  if (!file) return
                  this.setState(
                    ({value}) => ({value: value || file.name, hasFile: true}),
                    () => {
                      this._file = file
                    })
                }} />
                <Submit value={'Upload'} disabled={!this.state.value || !this.state.hasFile} />
              </Form>
            </Fragment>
          )
        }}
      </Mutation>
    )
  }
}

class ProjectsW extends React.Component<*, { sesh: number, modal: ?({ kind: 'create' } | { kind: 'update', p: gt.GetProjects_projects_edges_node } | { kind: 'delete', p: gt.GetProjects_projects_edges_node }) }> {
  state = {modal: null, sesh: 0}

  _isAdmin () {
    return !!(this.props.config.accessToken && this.props.config.accessToken.isAdmin)
  }

  render () {
    // TODO fix pagination
    return (
      <Query query={GET_PROJECTS} ssr>
        {({loading, error, data}: QueryRenderProps<gt.GetProjects, gt.GetProjectsVariables>) => {
          if (loading || error) {
            return null
          }
          const projects = (data && data.projects && data.projects.edges) || []
          return (
            <Fragment>
              <LeftNav>
                {
                  [
                    {
                      header: 'Overview',
                      menu: [
                        {
                          title: 'Projects',
                          to: this.props.match.url
                        }
                      ]
                    }
                  ]
                }
              </LeftNav>
              <Content>
                <TopNav config={this.props.config}>
                  {[
                    {
                      title: 'Projects',
                      type: '',
                      to: this.props.match.url
                    }
                  ]}
                </TopNav>
                <ContentView>
                  <Projects
                    isAdmin={this._isAdmin()}
                    url={this.props.match.url}
                    onDeleteProject={p => this.setState({modal: {kind: 'delete', p}})}
                    onEditProject={p => this.setState({modal: {kind: 'update', p}})}
                    onAddProject={() => this.setState({modal: {kind: 'create'}})}>
                    {projects}
                  </Projects>
                </ContentView>
              </Content>
              {this.state.modal && (
                <Modal onClose={() => this.setState({modal: null})}>
                  {this.state.modal.kind === 'create' &&
                  <AddProject onSuccess={(id) => {this.props.history.push(`${this.props.match.url}/${id}`)}} />}
                  {this.state.modal.kind === 'delete' &&
                  <DeleteProject {...this.state.modal.p} onClose={() => this.setState({modal: null})} />}
                  {this.state.modal.kind === 'update' &&
                  <EditProject {...this.state.modal.p} onSuccess={() => this.setState({modal: null})} />}
                </Modal>
              )}
            </Fragment>
          )
        }}
      </Query>
    )
  }
}

type ProjectModal =
  | { kind: 'uploadApplication' }
  | { kind: 'uploadReport' }
  | { kind: 'deleteReport', report: gt.GetProject_project_reports }
  | { kind: 'editReport', report: gt.GetProject_project_reports }
  | { kind: 'deleteApplication', application: gt.GetProject_project_applications }
  | { kind: 'editApplication', application: gt.GetProject_project_applications }

class ProjectW extends React.Component<*, { modal: ?ProjectModal }> {
  state = {modal: null}

  _isAdmin () {
    return !!(this.props.config.accessToken && this.props.config.accessToken.isAdmin)
  }

  render () {
    return (
      <Query query={GET_PROJECT} ssr variables={{id: this.props.match.params.project || ''}}>
        {({data, loading, error}: QueryRenderProps<gt.GetProject, gt.GetProjectVariables>) => {
          if (loading || error || !data || !data.project) return null
          const project = data.project
          return (
            <Fragment>
              <LeftNav>
                {[
                  {
                    header: 'Applications',
                    menu: project.applications.map(app => (
                      {
                        title: app.name,
                        to: `${this.props.match.url}/apps/${app.id}`,
                        icon: app.type === 'MOBILE' ? 'mobile' : 'desktop'
                      }
                    ))
                  },
                  {
                    header: 'Reports',
                    menu: project.reports.map(report => (
                      {
                        title: report.name,
                        to: `${this.props.match.url}/reports/${report.id}`,
                        icon: 'document'
                      }
                    ))
                  }
                ]}
              </LeftNav>
              <Switch>
                <Route path={`${this.props.match.path}/apps/:app`} render={({match: {params, url}}) => {
                  const app = project.applications.find(({id}) => id === params.app)
                  if (!app) return null
                  return (
                    <Content>
                      <TopNav config={this.props.config}>
                        {[
                          {
                            type: 'Project',
                            title: project.name,
                            to: `${this.props.match.url}`
                          },
                          {
                            type: 'Application',
                            title: app.name,
                            to: `${url}`
                          }
                        ]}
                      </TopNav>
                      <ContentView>
                        <Screenshot
                          isAdmin={this._isAdmin()}
                          app={app}
                          project={project.id} />
                      </ContentView>
                    </Content>
                  )
                }} />
                <Route path={`${this.props.match.path}/reports/:report`} render={({match: {params, url}}) => {
                  const report = project.reports.find(({id}) => id === params.report)
                  if (!report) return null
                  return (
                    <Content>
                      <TopNav config={this.props.config}>
                        {[
                          {
                            type: 'Project',
                            title: project.name,
                            to: `${this.props.match.url}`
                          },
                          {
                            type: 'Report',
                            title: report.name,
                            to: `${url}`
                          }
                        ]}
                      </TopNav>
                      <ContentView>
                        <Helmet title={report.name} />
                        <Report url={report.document.url} />
                      </ContentView>
                    </Content>
                  )
                }} />
                <Route render={() => (
                  <Content>
                    <TopNav config={this.props.config}>
                      {[
                        {
                          type: 'Project',
                          title: project.name,
                          to: `${this.props.match.url}`
                        }
                      ]}
                    </TopNav>
                    <ContentView>
                      <Project
                        isAdmin={this._isAdmin()}
                        onEditReport={report => this.setState({modal: {kind: 'editReport', report}})}
                        onDeleteReport={report => this.setState({modal: {kind: 'deleteReport', report}})}
                        onUploadReport={() => this.setState({modal: {kind: 'uploadReport'}})}
                        onUploadApplication={() => this.setState({modal: {kind: 'uploadApplication'}})}
                        onEditApplication={application => this.setState({
                          modal: {
                            kind: 'editApplication',
                            application
                          }
                        })}
                        onDeleteApplication={application => this.setState({
                          modal: {
                            kind: 'deleteApplication',
                            application
                          }
                        })}
                      >
                        {project}
                      </Project>
                    </ContentView>
                  </Content>
                )} />
              </Switch>

              {this.state.modal && (
                <Modal onClose={() => this.setState({modal: null})}>
                  {this.state.modal && this.state.modal.kind === 'uploadApplication' &&
                  <UploadApp onClose={() => this.setState({modal: null})} project={project.id} />}
                  {this.state.modal && this.state.modal.kind === 'uploadReport' &&
                  <UploadReport project={project.id} onClose={() => this.setState({modal: null})} />}
                  {this.state.modal && this.state.modal.kind === 'deleteReport' &&
                  <DeleteReport
                    {...this.state.modal.report} project={project.id}
                    onClose={() => this.setState({modal: null})} />}
                  {this.state.modal && this.state.modal.kind === 'editReport' &&
                  <EditReport
                    {...this.state.modal.report} project={project.id}
                    onClose={() => this.setState({modal: null})} />}
                  {this.state.modal && this.state.modal.kind === 'deleteApplication' &&
                  <DeleteApplication
                    {...this.state.modal.application} project={project.id}
                    onClose={() => this.setState({modal: null})} />}
                  {this.state.modal && this.state.modal.kind === 'editApplication' &&
                  <EditApplication
                    {...this.state.modal.application} project={project.id}
                    onClose={() => this.setState({modal: null})} />}
                </Modal>
              )}
            </Fragment>
          )
        }}
      </Query>
    )
  }
}

const AB = Button.withComponent('a')

class ShowLogin extends React.Component<{}, { show: bool }> {
  state = {show: false}

  render () {
    return (
      <React.Fragment>
        <KeyGrapper code={'Space'} on={last => last < 500 && this.setState({show: true})} />
        {this.state.show && <AB href={'/auth/login'}>Login</AB>}
      </React.Fragment>
    )
  }
}

const Fallback = styled(({isAdmin, ...props}) => (
  <div {...props}>
    <LogoIcon />
    {!isAdmin && <ShowLogin />}
  </div>))`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  ${LogoIcon} {
    height: 10em;
    width: 10em;
  }
  ${AB} {
    margin-top: 4em;
  }
`

export default ({config}: { config: HtmlConfig }) => {
  const isAdmin = config.accessToken && config.accessToken.isAdmin
  return (
    <Container>
      <Helmet title={'Ureka'} />
      <Switch>
        <Route path={'/projects/:project'}
               render={({match, history, location}) => <ProjectW {...{match, history, location}} config={config} />} />
        {isAdmin ? <Route path={'/projects'}
                          render={({match, history, location}) => <ProjectsW {...{match, history, location}}
                                                                             config={config} />} /> : null}
        {isAdmin ? <Redirect from={'/'} to={'/projects'} /> : null}
        <Route render={() => <Fallback isAdmin={isAdmin} />} />
      </Switch>
    </Container>
  )
}
