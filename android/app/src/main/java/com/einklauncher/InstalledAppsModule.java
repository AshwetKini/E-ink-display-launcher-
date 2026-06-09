package com.einklauncher;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.ByteArrayOutputStream;
import java.util.List;

public class InstalledAppsModule extends ReactContextBaseJavaModule {
  private final PackageManager packageManager;

  public InstalledAppsModule(ReactApplicationContext reactContext) {
    super(reactContext);
    packageManager = reactContext.getPackageManager();
  }

  @Override
  public String getName() {
    return "InstalledApps";
  }

  private String encodeAppIcon(ApplicationInfo appInfo) {
    try {
      Drawable iconDrawable = packageManager.getApplicationIcon(appInfo);
      if (iconDrawable == null) {
        return null;
      }

      Bitmap bitmap;
      if (iconDrawable instanceof BitmapDrawable) {
        bitmap = ((BitmapDrawable) iconDrawable).getBitmap();
      } else {
        int width = iconDrawable.getIntrinsicWidth() > 0 ? iconDrawable.getIntrinsicWidth() : 1;
        int height = iconDrawable.getIntrinsicHeight() > 0 ? iconDrawable.getIntrinsicHeight() : 1;
        bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        iconDrawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        iconDrawable.draw(canvas);
      }

      ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream);
      return Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP);
    } catch (Exception e) {
      return null;
    }
  }

  @ReactMethod
  public void getInstalledApps(Promise promise) {
    try {
      List<PackageInfo> packages = packageManager.getInstalledPackages(0);
      WritableArray apps = Arguments.createArray();

      for (PackageInfo pkg : packages) {
        Intent launchIntent = packageManager.getLaunchIntentForPackage(pkg.packageName);
        ApplicationInfo appInfo = pkg.applicationInfo;
        WritableMap app = Arguments.createMap();
        app.putString("packageName", pkg.packageName);
        app.putString("label", packageManager.getApplicationLabel(appInfo).toString());
        app.putBoolean("isSystem", (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
        app.putBoolean("launchable", launchIntent != null);
        String iconBase64 = encodeAppIcon(appInfo);
        if (iconBase64 != null) {
          app.putString("icon", iconBase64);
        }
        apps.pushMap(app);
      }

      promise.resolve(apps);
    } catch (Exception e) {
      promise.reject("ERR_APP_LIST", e.getMessage());
    }
  }

  @ReactMethod
  public void openApp(String packageName, Promise promise) {
    try {
      Intent launchIntent = packageManager.getLaunchIntentForPackage(packageName);
      if (launchIntent == null) {
        promise.reject("ERR_OPEN_APP", "Unable to launch app");
        return;
      }
      launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getReactApplicationContext().startActivity(launchIntent);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("ERR_OPEN_APP", e.getMessage());
    }
  }
}
