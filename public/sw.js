self.addEventListener("push",(event)=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch{data={};}
  const title=data.title||"Hanson Mobile Mechanics";
  const options={
    body:data.body||"You have a new service request.",
    icon:data.icon||"/hanson-official-logo.svg",
    badge:data.badge||"/hanson-official-logo.svg",
    tag:data.tag||"hanson-request",
    renotify:true,
    data:{url:data.url||"/admin/requests"}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener("notificationclick",(event)=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||"/admin/requests",self.location.origin).href;
  event.waitUntil(
    clients.matchAll({type:"window",includeUncontrolled:true}).then((windowClients)=>{
      for(const client of windowClients){
        if(client.url.startsWith(self.location.origin)&&"focus" in client){
          client.navigate(target);
          return client.focus();
        }
      }
      return clients.openWindow?clients.openWindow(target):undefined;
    })
  );
});
