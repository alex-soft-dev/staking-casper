// 1: Import
import React from 'react';
// import WebFont from 'webfontloader';
// import { useTheme } from './theme/useTheme';

import Main from './components/main';
import './App.css'

function App() {
  // 3: Get the selected theme, font list, etc.
  // const {theme, getFonts} = useTheme();
  // const [, setSelectedTheme] = useState(theme);

  // useEffect(() => {
  //   setSelectedTheme(theme);
  //  }, [themeLoaded]);

  // 4: Load all the fonts
  // useEffect(() => {
  //   WebFont.load({
  //     google: {
  //       families: getFonts()
  //     }
  //   });
  // });

  // 5: Render if the theme is loaded.
  return (
    <>
      {/* {
        themeLoaded && <ThemeProvider theme={ selectedTheme }>
          <GlobalStyles/>
          <div style={{fontFamily: selectedTheme.font}}>
              <Main className='main' />
          </div>
        </ThemeProvider>
      } */}
      <div>
          <Main />
      </div>
    </>
  );
}

export default App;