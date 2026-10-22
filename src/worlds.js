// the apps in the dock. each one is its own lazy chunk, loaded when you get within ~a screen of it.
export const WORLDS = [
  { id: 'boot', label: 'terminal', color: '#ffb000', minH: '100svh' },
  { id: 'notebook', label: 'notebook', color: '#d1301f', minH: '100svh', load: () => import('./worlds/Notebook.jsx'), raw: () => import('./worlds/Notebook.jsx?raw') },
  { id: 'roles', label: 'badges', color: '#ffb000', minH: '60svh', load: () => import('./worlds/Roles.jsx'), raw: () => import('./worlds/Roles.jsx?raw') },
  { id: 'mission', label: 'mission_ctrl', color: '#38ffb0', minH: '90svh', load: () => import('./worlds/Mission.jsx'), raw: () => import('./worlds/Mission.jsx?raw') },
  { id: 'projects', label: 'projects', color: '#ff7a59', minH: '200svh', load: () => import('./worlds/Projects.jsx'), raw: () => import('./worlds/Projects.jsx?raw') },
  { id: 'forge', label: 'the forge', color: '#39d353', minH: '420svh', load: () => import('./worlds/Forge.jsx'), raw: () => import('./worlds/Forge.jsx?raw') },
  { id: 'arcade', label: 'arcade', color: '#ffe600', minH: '130svh', load: () => import('./worlds/Arcade.jsx'), raw: () => import('./worlds/Arcade.jsx?raw') },
  { id: 'workshop', label: 'workshop', color: '#ff6a13', minH: '130svh', load: () => import('./worlds/Workshop.jsx'), raw: () => import('./worlds/Workshop.jsx?raw') },
  { id: 'museum', label: 'museum', color: '#c9a35a', minH: '140svh', load: () => import('./worlds/Museum.jsx'), raw: () => import('./worlds/Museum.jsx?raw') },
  { id: 'contact', label: 'boarding pass', color: '#e8412c', minH: '100svh', load: () => import('./worlds/Contact.jsx'), raw: () => import('./worlds/Contact.jsx?raw') },
]
