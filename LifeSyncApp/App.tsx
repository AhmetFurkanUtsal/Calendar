/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {StatusBar} from 'react-native';
import 'react-native-gesture-handler';

import {AppNavigator} from './src/navigation/AppNavigator';
import {DesignSystem} from './src/theme/designSystem';

function App(): React.JSX.Element {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={DesignSystem.colors.neutral[50]}
      />
      <AppNavigator />
    </>
  );
}

export default App;
