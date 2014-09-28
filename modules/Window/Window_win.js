module.exports = (function() {
  var Container = require('Container');
  var utilities = require('Utilities');
  var Color = require('Color');
  var $ = process.bridge.dotnet;
  var $$ = process.bridge;

  function Window(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.width = options.width || 500;
    options.height = options.height || 500;

    if(NativeObjectClass)
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.System.Windows.Window, $.System.Windows.Controls.Canvas, options);

    // Attach System.Windows.Window.Content = System.Windows.Controls.Canvas
    this.native.Content = this.nativeView; 

    //TODO: Add enter-fullscreen/exit-fullscreen
    this.native.addEventListener('Closing', function() { this.fireEvent('close'); }.bind(this));
    this.native.addEventListener('Closed', function() { this.fireEvent('closed'); }.bind(this));
    this.native.addEventListener('SizeChanged', function() { this.fireEvent('resize'); }.bind(this));
    this.native.addEventListener('Deactivated', function() { this.fireEvent('blur'); }.bind(this));
    this.native.addEventListener('Activated', function() { this.fireEvent('focus'); }.bind(this));
    this.native.addEventListener('StateChanged', function() {
      if(this.native.WindowState == $.System.Windows.WindowState.Maximized) this.fireEvent('maximize');
      else if(this.native.WindowState == $.System.Windows.WindowState.Minimized) this.fireEvent('minimize');
      else this.fireEvent('restore');
    }.bind(this));

    this.private.previousStyle='';
    this.private.previousState='';
    this.private.background='auto';
    this.private.menu=null;
    this.private.toolbar=null;
    this.private.fullscreen=false;
    this.private.closeButton = true;
    this.private.titleTextColor = "auto";

    //We cannot allow transparency unless there is no window style.
    //this.native.AllowsTransparency = true;
    this.native.ShowInTaskbar = true;
    this.native.ShowActivated = true;
    this.native.Width = options.width;
    this.native.Height = options.height;
    
    this.native.WindowStartupLocation = $.System.Windows.WindowStartupLocation.CenterScreen;

    var hwnd = new $.System.Windows.Interop.WindowInteropHelper(this.native).Handle;
    var margin = new $$.win32.structs.MARGIN;
    margin.cxLeftWidth = -1;
    margin.cxRightWidth = -1;
    margin.cyTopHeight = -1;
    margin.cyBottomHeight = -1;
    $$.win32.dwmapi.DwmExtendFrameIntoClientArea(hwnd.pointer,margin);

    this.native.Show();

    application.windows.push(this);
  }
  //http://blogs.msdn.com/b/wpfsdk/archive/2010/08/25/experiments-with-windowchrome.aspx

  Window.prototype = Object.create(Container.prototype);
  Window.prototype.constructor = Window;

  Window.prototype.preferences = {
    animateOnSizeChange:false,
    animateOnPositionChange:false
  }

  Object.defineProperty(Window.prototype, 'frame', {
    get:function() { return this.native.WindowStyle == $.System.Windows.WindowStyle.SingleBorderWindow; },
    set:function(e) {
      if(e) this.native.WindowStyle = $.System.Windows.WindowStyle.SingleBorderWindow;
      else if (e) this.native.WindowStyle = $.System.Windows.WindowStyle.None;
    }
  });

  Object.defineProperty(Window.prototype, 'menu', {
    get:function() { 
      //  return this.private.menu; 
    },
    set:function(e) {
      //this.private.menu = e;
      //global.application.native('setMainMenu', this.private.menu.native);
    }
  });

  Object.defineProperty(Window.prototype, 'toolbar', {
    get:function() { 
      //return this.private.toolbar; 
    },
    set:function(e) {
      /*if(this.frame == false && e) {
        if(application.warn) console.warn('Cannot add a toolbar to a window that has Window.frame = false;');
        return;
      }

      if(!e || e == null) {
        this.native('setStyleMask',this.native('styleMask') & ~$.NSUnifiedTitleAndToolbarWindowMask);
      } else {
        this.native('setStyleMask',this.native('styleMask') | $.NSUnifiedTitleAndToolbarWindowMask);
        this.private.toolbar = e;
        this.native('setToolbar', this.private.toolbar.native);
      }*/
      
    }
  });

  Object.defineProperty(Window.prototype, 'canBeFullscreen', {
    get:function() { return true; },
    set:function(e) { }
  });

  Object.defineProperty(Window.prototype, 'state', {
    get:function() { 
      if(this.private.fullscreen) return "fullscreen";
      else if(this.native.WindowState == $.System.Windows.WindowState.Maximized) return "maximized";
      else if(this.native.WindowState == $.System.Windows.WindowState.Minimized) return "minimized";
      else return "normal";
    },
    set:function(e) {
      if(e != "fullscreen" && this.private.fullscreen) {
        if(this.private.previousStyle != "") this.native.WindowStyle = this.private.previousStyle;
        else this.native.WindowStyle = $.System.Windows.WindowStyle.SingleBorderWindow;

        if(this.private.previousState != "") this.native.WindowState = this.private.previousState;
        else this.native.WindowState = $.System.Windows.WindowState.Normal;

        this.private.fullscreen = false;
      } 
      
      if(e == 'maximized')
        this.native.WindowState = $.System.Windows.WindowState.Maximized;
      else if (e == 'normal')
        this.native.WindowState = $.System.Windows.WindowState.Normal;
      else if (e == 'minimized')
        this.native.WindowState = $.System.Windows.WindowState.Minimized;
      else if (e == 'fullscreen' && !this.private.fullscreen) {
        this.native.previousStyle = this.native.WindowStyle;
        this.native.previousState = this.native.WindowState;
        this.native.WindowState = $.System.Windows.WindowState.Maximized;
        this.native.WindowStyle = $.System.Windows.WindowStyle.None;
        this.private.fullscreen = true;
      }
    }
  });

  Object.defineProperty(Window.prototype, 'title', {
    get:function() { return this.native.Title; },
    set:function(e) { this.native.Title = e.toString(); }
  });

  Object.defineProperty(Window.prototype, 'y', {
    get:function() { return Math.floor(this.native.Top); },
    set:function(e) {
      if(e == 'center') {
        var workingArea = $.System.Windows.SystemParameters.WorkArea;
        this.native.Left = workingArea.width/2 - this.native.Width/2;
        this.native.Top = workingArea.height/2 - this.native.Height/2;
      } else {
        var workingArea = $.System.Windows.SystemParameters.WorkArea;
        e = utilities.parseUnits(e);
        this.native.Top = e + workingArea.Y;
      }
    }
  });

  Object.defineProperty(Window.prototype, 'x', {
    get:function() { return Math.floor(this.native.Left); },
    set:function(e) {
      if(e == 'center') {
        var workingArea = $.System.Windows.SystemParameters.WorkArea;
        this.native.Left = workingArea.width/2 - this.native.Width/2;
        this.native.Top = workingArea.height/2 - this.native.Height/2;
      } else {
        var workingArea = $.System.Windows.SystemParameters.WorkArea;
        e = utilities.parseUnits(e);
        this.native.Left = e + workingArea.X;
      }
    }
  });

  Object.defineProperty(Window.prototype, 'width', {
    get:function() { return Math.floor(this.native.Width); },
    set:function(e) {
        e = utilities.parseUnits(e);
        this.native.Width = e;
    }
  });

  Object.defineProperty(Window.prototype, 'height', {
    get:function() { return Math.floor(this.native.Height); },
    set:function(e) {
        e = utilities.parseUnits(e);
        this.native.Height = e;
    }
  });

  Object.defineProperty(Window.prototype, 'titleVisible', {
    get:function() { return true; },
    set:function(e) { /* TODO ? */ }
  });

  // Override from Control.
  Object.defineProperty(Window.prototype, 'visible', {
    get:function() { return this.native.Visibility == $.System.Windows.Visibility.Visible; },
    set:function(e) {
      if(e) {
        this.native.Visibility = $.System.Windows.Visibility.Visible;
        this.native.Show();
      } else {
        this.native.Visibility = $.System.Windows.Visibility.Hidden;
        this.native.Hide();
      }
    }
  });

  Object.defineProperty(Window.prototype, 'maximizeButton', {
    get:function() {
      var hwnd = new $.System.Windows.Interop.WindowInteropHelper(this.native).Handle;
      return $$.win32.user32.GetWindowLongA(hwnd.pointer, $$.win32.user32.GWL_STYLE) & $$.win32.user32.WS_MAXIMIZEBOX;
    },
    set:function(e) {
      if(e) {
        var hwnd = new $.System.Windows.Interop.WindowInteropHelper(this.native).Handle;
        var value = $$.win32.user32.GetWindowLongA(hwnd.pointer, $$.win32.user32.GWL_STYLE);
        var result = $$.win32.user32.SetWindowLongA(hwnd.pointer, $$.win32.user32.GWL_STYLE, (value | $$.win32.user32.WS_MAXIMIZEBOX));
      } else {
        var hwnd = new $.System.Windows.Interop.WindowInteropHelper(this.native).Handle;
        var value = $$.win32.user32.GetWindowLongA(hwnd.pointer, $$.win32.user32.GWL_STYLE);
        var result = $$.win32.user32.SetWindowLongA(hwnd.pointer, $$.win32.user32.GWL_STYLE, (value & ~$$.win32.user32.WS_MAXIMIZEBOX));
      }
    }
  });

  Object.defineProperty(Window.prototype, 'minimizeButton', {
    get:function() {
      var hwnd = new $.System.Windows.Interop.WindowInteropHelper(this.native).Handle;
      return $$.win32.user32.GetWindowLongA(hwnd.pointer, $$.win32.user32.GWL_STYLE) & $$.win32.user32.WS_MINIMIZEBOX;
    },
    set:function(e) {
      if(e) {
        var hwnd = new $.System.Windows.Interop.WindowInteropHelper(this.native).Handle;
        var value = $$.win32.user32.GetWindowLongA(hwnd.pointer, $$.win32.user32.GWL_STYLE);
        var result = $$.win32.user32.SetWindowLongA(hwnd.pointer, $$.win32.user32.GWL_STYLE, (value | $$.win32.user32.WS_MINIMIZEBOX));
      } else {
        var hwnd = new $.System.Windows.Interop.WindowInteropHelper(this.native).Handle;
        var value = $$.win32.user32.GetWindowLongA(hwnd.pointer, $$.win32.user32.GWL_STYLE);
        var result = $$.win32.user32.SetWindowLongA(hwnd.pointer, $$.win32.user32.GWL_STYLE, (value & ~$$.win32.user32.WS_MINIMIZEBOX));
      }
    }
  });

  Object.defineProperty(Window.prototype, 'closeButton', {
    get:function() { return this.private.closeButton; },
    set:function(e) {
      this.private.closeButton = e;
      if(e) {
        var hwnd = new $.System.Windows.Interop.WindowInteropHelper(this.native).Handle;
        var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer, false);
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_CLOSE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_ENABLED);
      } else {
        var hwnd = new $.System.Windows.Interop.WindowInteropHelper(this.native).Handle;
        var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer, false);
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_CLOSE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_GRAYED);
      }
    }
  });

  Object.defineProperty(Window.prototype, 'fullscreenButton', {
    get:function() { return false; },
    set:function(e) { /* Todo ? */ }
  });

  Object.defineProperty(Window.prototype, 'resizable', {
    get:function() { 
      return this.native.ResizeMode != $.System.Windows.ResizeMode.NoResize && 
        this.native.ResizeMode != $.System.Windows.ResizeMode.CanMinimize;
    },
    set:function(e) {
      if(e) this.native.ResizeMode = $.System.Windows.ResizeMode.CanResizeWithGrip;
      else this.native.ResizeMode = $.System.Windows.ResizeMode.CanMinimize;
    }
  });

  Object.defineProperty(Window.prototype, 'titleTextColor', {
    get:function() { return this.private.titleTextColor; },
    set:function(e) {
      this.private.titleTextColor = e;
    }
  });

  Object.defineProperty(Window.prototype, 'backgroundColor', {
    get:function() { return this.private.background; },
    set:function(e) {
      if(e == 'auto') {
        this.private.background = 'auto';
        this.native.Background = new $.System.Windows.Media.SolidColorBrush($.System.Windows.SystemColors.WindowFrame);
        this.native.Content.Background = new $.System.Windows.Media.SolidColorBrush($.System.Windows.SystemColors.WindowFrame);
      } else {
        this.private.background = e;
        this.private.backgroundObj = new Color(e);
        this.native.Background = new $.System.Windows.Media.SolidColorBrush(this.private.backgroundObj.native);
        this.native.Content.Background = new $.System.Windows.Media.SolidColorBrush(this.private.backgroundObj.native);
        this.native.Content.BorderBrush = new $.System.Windows.Media.SolidColorBrush(this.private.backgroundObj.native);
      }
    }
  });

  Object.defineProperty(Window.prototype, "alwaysOnTop", {
    get:function() { return this.native.Topmost; },
    set:function(e) { this.native.Topmost = e ? true : false; }
  });

  Window.prototype.close = function() {
    application.windows.forEach(function(item,ndx,arr) { 
      if(item == this)
        delete arr[ndx];
    });
    this.native.Close();
  }

  Window.prototype.bringToFront = function() { 
    this.native.Activate();
  }

  return Window;
})();