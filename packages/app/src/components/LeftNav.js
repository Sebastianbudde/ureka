// @flow
import * as React from 'react'
import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import { DesktopIcon, DocIcon, Icon, LogoIcon, MobileIcon, ProjectIcon } from './Icons'

const MenuLink = styled(NavLink)`
  padding: 0 1.25em;
  position: relative;
  display: block;
  height: 3em;
  line-height: 3em;
  color: #fff;
  text-decoration: none;
  span {
    font-size: 0.85em;
  }
  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background-color: #3AEFD4;
    opacity: 0;
    transition: width 0.1s, opacity 0.1s;
  }
  &.active:before {
    opacity: 1;
    width: 0.3em;
  }
  > ${Icon} {
    fill: #ffffff;
    height: 1.7em;
    width: 1.7em;
    vertical-align: middle;
    margin-right: 1em;
  }
`

const LogoName = styled.span`
  font-family: "Unica One", sans-serif;
  color: #ffffff;
  font-size: 2em;
`
const Logo = styled(NavLink)`
  text-decoration: none;
  > ${LogoIcon} {
    width: 1.7em;
    height: 1.7em;
    display: inline-block;
    vertical-align: middle;
  }
  
  > ${LogoName} {
    margin-left: 0.5em;
    vertical-align: middle;
  }
`
const LogoContainer = styled.div`
  height: 5.5em;
  background-color: #4C6073;
  position: relative;
  > ${Logo} {
    position: absolute;
    bottom: 1.3em;
    left: 1.25em;
  }
`

const MenuHeader = styled.b`
  padding: 0 1.25em;
  color: #768A9C;
  font-family: "Roboto Condensed", sans-serif;
  font-weight: 700;
  span {
    font-size: 0.85em;
  }
`

const Menu = styled.ul`
  list-style-type: none;
  padding: 1em 0;
  font-size: 1em;
  overflow-y: scroll;
  margin: 0;
  ::-webkit-scrollbar {
    width: 0.5em;
  }
   
  ::-webkit-scrollbar-track {
    background-color: transparent;
  }
   
  ::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255,255, 0.2);
  }
`

const MenuItem = styled.li`
  font-family: "Roboto Condensed", sans-serif;
  font-weight: 400;
  padding: 0.5em 0 ;
  overflow: hidden;
  > ${MenuLink} {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    text-decoration: none;
    color: #ffffff;
  }
`

const SubMenu = styled.ul`
  list-style-type: none;
  padding: 0;

`

type Nav = {|
  header?: string,
  menu: {| icon?: 'document' | 'mobile' | 'desktop' | 'project', title: string, to: string |}[]
|}

type Props = { children?: Nav[], className?: string }

const LeftNav = ({className, children}: Props) => (
  <nav className={className}>
    <LogoContainer>
      <Logo to={'/'}>
        <LogoIcon />
        <LogoName>
          ureka
        </LogoName>
      </Logo>
    </LogoContainer>
    <Menu>
      {(children || []).map((nav, i) => (
        <MenuItem key={i}>
          {nav.header &&
          (<MenuHeader>
            <span>
            {nav.header}
            </span>
          </MenuHeader>)}
          <SubMenu>
            {nav.menu.map((menu, i) => (
              <MenuItem key={i}>
                <MenuLink to={menu.to} activeClassName={'active'}>
                  {(icon => {
                    switch (icon) {
                      case 'desktop':
                        return <DesktopIcon />
                      case 'mobile':
                        return <MobileIcon />
                      case 'document':
                        return <DocIcon />
                      case 'project':
                        return <ProjectIcon />
                      default:
                        return null
                    }
                  })(menu.icon)}
                  <span>
                    {menu.title}
                  </span>
                </MenuLink>
              </MenuItem>
            ))}
          </SubMenu>
        </MenuItem>
      ))}

    </Menu>
  </nav>
)

const s: React.ComponentType<Props> = styled(LeftNav)`
  background-color: #425261;
  display: flex;
  flex-direction: column;
  > ${LogoContainer} {
    flex-grow: 0;
    flex-shrink: 0;
    flex-basis: 5.5em;
  }
  > ${Menu} {
    flex-grow: 1;
    flex-shrink: 1;
  }

`

export default s
