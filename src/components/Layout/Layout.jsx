import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar/Navbar'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Ir al contenido principal
      </a>
      <Navbar />
      <main id="main-content" className={styles.content} tabIndex="-1">
        <Outlet />
      </main>
    </>
  )
}
